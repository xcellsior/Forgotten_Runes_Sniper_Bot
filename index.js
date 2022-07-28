require('dotenv').config();
const client = require('./discordnotifier');
const chain = require('./chain');
const Web3 = require("web3");
const utils = require("./utils");
const web3 = new Web3(
    new Web3.providers.WebsocketProvider(process.env.RPC2)
);
const warriorAbi = require('./abis/warriorabi.json');
const {checkMatch} = require("./utils");
let prevVaultWarriors = [];
let vaultWarriors = [];
let init = true;
const warriorContract = new web3.eth.Contract(
    warriorAbi,
    '0x9690b63Eb85467BE5267A3603f770589Ab12Dc95'
)
const sudoswapVault = '0x24979C90855a737911D26fBB78b1465019e13e08'
main();


async function main(){
    // start a thread to subscribe to events on NFTX

    await transferMonitor();
    await vaultMonitor();
}
async function transferMonitor() {
    warriorContract.events.Transfer({})
        .on('data', async (event) => {
            console.log(event);

            // parse event topics
            const to = `0x${event.raw.topics[2].substr(-40)}`.toLowerCase()

            // Example:
            // Convert 0x0000000000000000000000000000000000000000000000000000000000003882
            // to ['14466']
            let id = [];
            id[0] = [event.raw.topics[3].substr(-4)];
            id[0] = parseInt(Number(`0x${id[0]}`).toString(),10).toString();
            // I'm starting to feel a certain way about JS
            console.log(`ID: ${id} transfer detected`)
            if (to.toLowerCase() === sudoswapVault.toLowerCase()) {
                let rareDetect = utils.checkMatch(id)
                if (rareDetect.length > 0) {
                    const formatMsg = utils.formatNFTEmbed(rareDetect);
                    await client.postMessage(formatMsg);
                }
            }
        })
        .on('error', error => {
            console.log(error);
        })

}

async function vaultMonitor() {
    try {
    web3.eth.subscribe('newBlockHeaders').on('data', async block => {
        if (init){
            init = false;
            prevVaultWarriors = await chain.getNFTXWarriors();
        }
        // ToDo distant future: multicall all collection inquiries
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