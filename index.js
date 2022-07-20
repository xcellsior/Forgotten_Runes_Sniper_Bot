const axios = require('axios');
const fs = require("fs");
const utils = require('./utils.js');
require('dotenv').config();
const client = require('./discordnotifier');
const chain = require('./chain');
const Web3 = require("web3");
const web3 = new Web3(
    new Web3.providers.WebsocketProvider(process.env.RPC2)
);

let prevVaultWarriors = [];
let vaultWarriors = [];
let init = true;


main();

async function main(){
    // start a thread to subscribe to events on NFTX
    await vaultMonitor();
}

async function vaultMonitor() {
    web3.eth.subscribe('newBlockHeaders').on('data', async block => {
        if (init){
            init = false;
            prevVaultWarriors = await chain.getNFTXWarriors();
        }
        vaultWarriors = await chain.getNFTXWarriors();
        let difference = vaultWarriors.filter( x => !prevVaultWarriors.includes(x));
        prevVaultWarriors = vaultWarriors;
        if (difference.length !== 0)
        {
            // await client.postMessage(difference);
        }
        await client.postMessage(block.number);
    }).on('error', error => {
        console.log(error);
    })
}