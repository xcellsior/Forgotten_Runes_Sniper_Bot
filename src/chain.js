const Web3 = require("web3");
require('dotenv').config()
const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.RPC2));
let count = 0;

const NFTX_WARRIOR_VAULT = '0xe218A21d03dea706d114D9c4490950375f3B7C05';
const NFTX_WIZARD_VAULT = '0x87931e7ad81914e7898d07c68f145fc0a553d8fb';
const MULTICALL_ADDRESS = '0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441';
const multicallAbi = require('../abis/multicallabi.json');

async function getTotalWarriors() {
    let block = await web3.eth.getBlockNumber();
    const methodHash = web3.utils.sha3('numMinted()').substr(0, 10);
    const bytes = `${methodHash}`;
    const callResult = await web3.eth.call({
        to: '0x9690b63eb85467be5267a3603f770589ab12dc95',
        data: bytes.toString()
    }, block);

    return web3.eth.abi.decodeParameter('uint256', callResult)
}

// TODO: condense both into just 'getNFTXVault(vaultAddr)' or multicall
async function getNFTXWarriors() {
    let block = await web3.eth.getBlockNumber();
    console.log(`Count: ${count++}`);
    const methodHash = web3.utils.sha3('allHoldings()').substr(0, 10);
    const bytes = `${methodHash}`;
    const callResult = await web3.eth.call({
        to: NFTX_WARRIOR_VAULT,
        data: bytes.toString()
    }, block);

    const decodedResult = web3.eth.abi.decodeParameter('uint256[]', callResult);
    return decodedResult;
}
async function getNFTXWizards() {
    const methodHash = web3.utils.sha3('allHoldings()').substr(0, 10);
    const bytes = `${methodHash}`;
    const callResult = await web3.eth.call({
        to: NFTX_WIZARD_VAULT,
        data: bytes.toString()
    }, block);

    return web3.eth.abi.decodeParameter('uint256[]', callResult);
}

/* Getter function for the last number of blocks */
function getBlockCount() {
    return count;
}

/* Primarily, this will be for parsing NFTX events that we subscribe to. We want to listen
*  to both wizard and warrior events, and return data when there is an addition to the pool */

// want to detect sell, swap, and stake
async function NFTXevents() {
    // let NFTXWarriors = web3.eth.subscribe("logs",{address: NFTX_WARRIOR_VAULT, topics: []} )


}


// TODO futureproofing: pass in array of collections and dynamically update call params via loop
async function multicall() {
    console.log(`Count: ${count++}`);
    const methodHash = web3.utils.sha3('allHoldings()').substr(0, 10);
    const bytes = `${methodHash}`;
    let call = [
        {
            target: NFTX_WARRIOR_VAULT,
            callData: bytes
        },
        {
            target: NFTX_WIZARD_VAULT,
            callData: bytes
        },
    ];
    const multicallContract = new web3.eth.Contract(
        multicallAbi,
        MULTICALL_ADDRESS
    );
    let data = await multicallContract.methods.aggregate(call).call();
    let returnData = [];
    for (let i = 0; i < data[1].length; i++){
        returnData[i] = web3.eth.abi.decodeParameter('uint256[]', data[1][i]);
    }
    return returnData;
}

module.exports = {
    getTotalWarriors,
    getNFTXWarriors,
    getNFTXWizards,
    NFTXevents,
    getBlockCount,
    multicall
}

