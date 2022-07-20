const Web3 = require("web3");
require('dotenv').config()
const web3 = new Web3(
    new Web3.providers.HttpProvider(process.env.RPC)
);

const NFTX_WARRIOR_VAULT = '0xe218A21d03dea706d114D9c4490950375f3B7C05';

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

async function getNFTXWarriors() {
    let block = await web3.eth.getBlockNumber();
    console.log(`Fetching NFTX Warriors`);
    const methodHash = web3.utils.sha3('allHoldings()').substr(0, 10);
    const bytes = `${methodHash}`;
    const callResult = await web3.eth.call({
        to: NFTX_WARRIOR_VAULT,
        data: bytes.toString()
    }, block);

    const decodedResult = web3.eth.abi.decodeParameter('uint256[]', callResult);
    return decodedResult;
}

/* Primarily, this will be for parsing NFTX events that we subscribe to. We want to listen
*  to both wizard and warrior events, and return data when there is an addition to the pool */


// want to detect sell, swap, and stake
async function NFTXevents() {
    // let NFTXWarriors = web3.eth.subscribe("logs",{address: NFTX_WARRIOR_VAULT, topics: []} )


}


module.exports = {
    getTotalWarriors,
    getNFTXWarriors,
    NFTXevents,
}

