require('dotenv').config();
const client = require('./discordnotifier');
const chain = require('./chain');
const Web3 = require("web3");
const utils = require("./utils");
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
    try {
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
            console.log(difference);
            const rareDetect = utils.checkMatch(difference);
            if (rareDetect.length > 0){
                const formatMsg = utils.formatNFTEmbed(rareDetect);
                await client.postMessage(formatMsg);
            }
        }
        //await client.postMessage(block.number);
    }).on('error', error => {
        console.log(error);
    })
    }
    catch {
        console.log("REEEE try")
        await vaultMonitor();
    }
}