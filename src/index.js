require('dotenv').config();
//import express from 'express';
const express = require('express');
const port = 9001;
const app = express();
const client = require('./discordnotifier');
const chain = require('./chain');
const Web3 = require("web3");
const utils = require("./utils");
const web3 = new Web3(
    //new Web3.providers.WebsocketProvider('wss://192.168.1.65:8545')
    new Web3.providers.WebsocketProvider(process.env.RPC2)
);
const warriorAbi = require('../abis/warriorabi.json');
const wizardAbi = require('../abis/wizardabi.json');
let prevVaultWarriors = [];
let prevVaultWizards = [];
let vaultWarriors = [];
let vaultWizards = [];
let init = true;
const WARRIOR_ADDRESS = '0x9690b63Eb85467BE5267A3603f770589Ab12Dc95';
const WIZARD_ADDRESS = '0x521f9C7505005CFA19A8E5786a9c3c9c9F5e6f42';

const warriorContract = new web3.eth.Contract(
    warriorAbi,
    WARRIOR_ADDRESS
);

const wizardContract = new web3.eth.Contract(
    wizardAbi,
    WIZARD_ADDRESS
);
const sudoWarriorVault = '0x24979C90855a737911D26fBB78b1465019e13e08';
const sudoWizardVault = '0xA7e8058C30a592AA5b891CF24c75D7745CfC7c86';
const NFTX_WARRIOR_VAULT = '0x9690b63Eb85467BE5267A3603f770589Ab12Dc95';

main();

async function main(){
    while (init){
        init = await prepopulateVaults();
    }
    await sudoWarriorMonitor();
    await sudoWizardMonitor();
    await NFTXVaultMonitor();
    //await wizardVaultMonitor();
}

/*  This function is to avoid an infrequent race condition where the first vault query returns later than the second.
    Previously, it would think it just found all of the already existing desired traits in NFTX
    and thus alert as if a bunch of new NFTs had just arrived.
 */
async function prepopulateVaults() {
    // TODO replace with scalable data structure
    let vaultResults = await chain.multicall();
    prevVaultWarriors = vaultResults[0];
    prevVaultWizards = vaultResults[1];
    return !((prevVaultWarriors != null) && (prevVaultWizards != null));
}

/* This is not aptly named - it monitors sudoswap for warriors */
async function sudoWarriorMonitor() {
    warriorContract.events.Transfer({})
        .on('data', async (event) => {
            // parse event topics
            const to = `0x${event.raw.topics[2].substr(-40)}`.toLowerCase()
            console.log(web3.eth.abi.decodeParameter('uint256', event.raw.topics[3]));
            // Example:
            // Convert 0x0000000000000000000000000000000000000000000000000000000000003882
            // to ['14466']
            let id = [];
            id[0] = [event.raw.topics[3].substr(-4)]; // grab the last 4 chars
            id[0] = parseInt(Number(`0x${id[0]}`).toString(),10).toString(); // convert to int string
            // please don't @ me for how stupid this looks

            // alternatively use the actual built in web3 function for this: decodeParameter TODO test this
            // const id[0] = web3.eth.abi.decodeParameter('uint256', event.raw.topics[3]);

            console.log(`ID: ${id} transfer detected`)
            if (to.toLowerCase() === sudoWarriorVault.toLowerCase()) {
                let rareDetect = utils.checkMatch(id)
                if (rareDetect.length > 0) {
                    const formatMsg = await utils.sudoswapTagging(rareDetect, WARRIOR_ADDRESS);
                    await client.postMessage(formatMsg);
                }
            }
        })
        .on('error', error => {
            console.log(error);
        })
}

async function sudoWizardMonitor() {
    wizardContract.events.Transfer({})
        .on('data', async (event) => {
            // parse event topics
            const to = `0x${event.raw.topics[2].substr(-40)}`.toLowerCase(); // expect vault addr
            let id = [];
            id[0] = web3.eth.abi.decodeParameter('uint256', event.raw.topics[3]);

            console.log(`ID: ${id} transfer detected`)
            if (to.toLowerCase() === sudoWizardVault.toLowerCase()) {
                let rareDetect = utils.checkMatch(id, 'wizards')
                if (rareDetect.length > 0) {
                    const formatMsg = await utils.sudoswapTagging(rareDetect, WIZARD_ADDRESS);
                    await client.postMessage(formatMsg);
                }
            }
        })
        .on('error', error => {
            console.log(error);
        })
}

async function NFTXVaultMonitor() {
    try {
    web3.eth.subscribe('newBlockHeaders').on('data', async block => {
        // vaultWarriors = await chain.getNFTXWarriors();
        // vaultWizards = await chain.getNFTXWizards();
        let vaultResults = await chain.multicall();
        let differenceWar = vaultResults[0].filter(x => !prevVaultWarriors.includes(x));
        let differenceWiz = vaultResults[1].filter(x => !prevVaultWizards.includes(x));

        prevVaultWarriors = vaultResults[0];
        prevVaultWizards = vaultResults[1];

        // TODO fix this undynamic garbage
        if (differenceWar.length !== 0 || differenceWiz.length !== 0)
        {
            let rareDetect = utils.checkMatch(differenceWar);
            if (rareDetect.length > 0){
                const formatMsg = await utils.formatNFTEmbed(rareDetect);
                await client.postMessage(formatMsg);
            }
            rareDetect = utils.checkMatch(differenceWiz, 'wizards');
            if (rareDetect.length > 0){
                const formatMsg = await utils.formatNFTEmbed(rareDetect);
                await client.postMessage(formatMsg);
            }
        }
        }).on('error', error => {
            console.log(error);
        })
    }
    catch {
        console.log("REEEE try")
        await NFTXVaultMonitor();
    }
}

/* API
   The API is added as a solution to silent error handling when getting stuck receiving blocks via Web3
*/
app.listen(port, function() {
    console.log(`Bot is listening on port ${port}!`)
});
app.get('/blockCount', (req, res) => {
    let block = chain.getBlockCount();
    res.send(block.toString());
});