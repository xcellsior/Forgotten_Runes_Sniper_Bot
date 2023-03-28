const fs = require("fs");
const chain = require("./chain");
const axios = require("axios");
const {MessageEmbed, MessageAttachment} = require("discord.js");

// GLOBAL DATA
let freq = {}; // rarity dictionary
let freqWiz = {}; // wizard rarity dictionary
//let rawWizData = fs.readFileSync('WizAttributes.json');
//let wizData = JSON.parse(rawWizData);
let rawWarData = fs.readFileSync('WarAttributes.json');
let warData = JSON.parse(rawWarData);
let rawWizData = fs.readFileSync('WizAttributes.json');
let wizData = JSON.parse(rawWizData);
const rarityPercentageDefault = .00362; // warriors
const rarityDefaultWizards = .0055;
const NUM_WIZARDS = 10000;
let numWarriors = warData.length;
console.log("num warriors: " + numWarriors);
let rarityRatio = numWarriors * rarityPercentageDefault;
let desiredTraits = require('./desiredtraits');
let warriorTraits = Object.keys(desiredTraits.warriorTraits);
const wizardTraits = desiredTraits.wizardTraits;

const VAULT_SNIPER = '1054505352432988220';
const WARRIOR_ADDRESS = '0x9690b63Eb85467BE5267A3603f770589Ab12Dc95';
const WIZARD_ADDRESS = '0x521f9C7505005CFA19A8E5786a9c3c9c9F5e6f42';

// const sdk = require('api')('@reservoirprotocol/v1.0#2l59jy7wlduobdqn');
//
// sdk.auth('demo-api-key');
// sdk.getTokensV5({
//     collection: '0x521f9C7505005CFA19A8E5786a9c3c9c9F5e6f42',
//     tokens: '0x521f9C7505005CFA19A8E5786a9c3c9c9F5e6f42%3A9648',
//     accept: '*/*'
// })
//     .then(({ data }) => console.log(data))
//     .catch(err => console.error(err));

const warTraits = [
    'companion',
    'body',
    'head',
    'shield',
    'weapon',
    'rune',
    'affinity'
];
const wizTraits = [
    'head',
    'body',
    'Affinity',
    'familiar',
    'prop',
    'rune',
];

processAttributes();

//TODO modify this and checkMatch to pass in any collection generically
function processAttributes() {
    //freq = [];
    for (let attributes of warData) {
        for (let attribute of attributes) {
            if (freq[attribute.value] === undefined){
                freq[attribute.value] = 1;
            }
            else{
                freq[attribute.value] += 1;
            }
        }
    }
    for (let attributes of Object.values(wizData)) {
        for (let attribute of attributes.attributes) {
            if (freqWiz[attribute.value] === undefined){
                freqWiz[attribute.value] = 1;
            }
            else{
                freqWiz[attribute.value] += 1;
            }
        }
    }
}

// IDEA: Collection integrations: make a separate file for parsing the metadata of any new collection
// Pass the collection name (or an ID) and move this somewhat redundant code to a new file
function checkMatch(NFTX_Ids, collection = 'warriors', rarity = rarityPercentageDefault) {
    let rareNFTs = [];

    if (collection === 'wizards') {
        rarityRatio = NUM_WIZARDS * rarityDefaultWizards;
        for (let i = 0; i < NFTX_Ids.length; i++) {
            // cross check if any values are sub .5% in rarity
            for (let properties of wizData[NFTX_Ids[i]].attributes) {
                //console.log(properties);
                if (wizTraits.includes(properties['trait_type'])) {
                    // if the frequency of this property value is less than the desired rarity (aka rarer), then spit out ID
                    if (freqWiz[properties['value']] < rarityRatio || wizardTraits.includes(properties['value'])) {
                        let rarity = freqWiz[properties['value']] / NUM_WIZARDS * 100;
                        rarity = parseFloat(rarity).toFixed(3);
                        console.log(`Rare trait (rarity ${rarity} %): ${properties['value']} detected on ${NFTX_Ids[i]}`)
                        rareNFTs.push({
                            id: NFTX_Ids[i],
                            link: `https://nftx.io/vault/0x87931e7ad81914e7898d07c68f145fc0a553d8fb/${NFTX_Ids[i]}/`,
                            property: properties['value'],
                            rarity: rarity
                        })
                    }
                }
            }
        }

    }
    else {
        rarityRatio = numWarriors * rarity;
        for (let i = 0; i < NFTX_Ids.length; i++) {
            // cross check if any values are sub .5% in rarity
            for (let properties of warData[NFTX_Ids[i]]) {
                //console.log(properties);
                if (warTraits.includes(properties['trait_type'])) {
                    // if the frequency of this property value is less than the desired rarity (aka rarer), then spit out ID
                    if (freq[properties['value']] < rarityRatio || warriorTraits.includes(properties['value'])) {
                        let rarity = freq[properties['value']] / numWarriors * 100;
                        rarity = parseFloat(rarity).toFixed(3);
                        console.log(`Rare trait (rarity ${rarity} %): ${properties['value']} detected on ${NFTX_Ids[i]}`)
                        rareNFTs.push({
                            id: NFTX_Ids[i],
                            link: `https://nftx.io/vault/0xe218a21d03dea706d114d9c4490950375f3b7c05/${NFTX_Ids[i]}/`,
                            property: properties['value'],
                            rarity: rarity
                        })
                    }
                }
            }
        }
    }
    return rareNFTs;
}

async function update() {
    // get current amount of total warriors from web3
    // numMinted function 0x9690b63eb85467be5267a3603f770589ab12dc95
    // https://etherscan.io/address/0x9690b63eb85467be5267a3603f770589ab12dc95#code
    let totalWarriors = await chain.getTotalWarriors();
    console.log(`total warriors: ${totalWarriors}`)
    let dict = [];
    if(numWarriors < totalWarriors){
        for (let i = numWarriors; i < totalWarriors; i++) {
            let traits;
            try {
                traits = await axios.get(`https://portal.forgottenrunes.com/api/warriors/data/${i}`);
            }
            catch (e) {
                console.log(`trying again ${i}`)
                traits = await axios.get(`https://portal.forgottenrunes.com/api/warriors/data/${i}`)
                    .catch(function (error) {
                        if (error.response){
                            console.log(error.response.data)
                        }

                        let data = warData.concat(dict);
                        data = JSON.stringify(data);
                        fs.writeFile('WarAttributes.json', data,(err) => {
                            if (err) {
                                throw err;
                            }
                            console.log("JSON data is saved. YOU NEED TO RESTART THE BOT");
                        });
                        numWarriors = totalWarriors;
                    });
            }
            console.log(i)
            dict.push(traits.data.attributes)
        }
        let data = warData.concat(dict);
        data = JSON.stringify(data);
        fs.writeFile('WarAttributes.json', data,(err) => {
            if (err) {
                throw err;
            }
            console.log("JSON data is saved.");
        });
        numWarriors = totalWarriors;
    }
    else{
        //print already up to date
    }
}

async function formatNoTagging(data) {
    let result = "Results: \n";
    data.forEach(nft =>{
        result = result.concat(`ID: ${nft.id}, Link: [NFTX](${nft.link}), Trait: ${nft.property}, Rarity: ${nft.rarity}%\n`)
    })
    return result;
}

async function sudoswapTagging(data, collection) {
    let result = `<@&${VAULT_SNIPER}> I found a rare in the Sudoswap vault: \n`;
    data.forEach(nft =>{
        result = result.concat(`ID: ${nft.id}, Link: https://sudoswap.xyz/#/item/${collection}/${nft.id}, Trait: ${nft.property}, Rarity: ${nft.rarity}%\n`)
    })
    return result;
}

function formatSudoLink(rares, collection = 'warriors') {
    switch(collection) {
        case 'warriors':
            rares.forEach((rare) => {
                rare.link = `https://sudoswap.xyz/#/item/${WARRIOR_ADDRESS}/${rare.id}`;
            })
            break;
        case 'wizards':
            rares.forEach((rare) => {
                rare.link = `https://sudoswap.xyz/#/item/${WIZARD_ADDRESS}/${rare.id}`;
            })
            break;
    }
    return rares;
}


// Call Reservoir to see if candidate NFTs are flagged on OS
// take an array of IDs, and return array of corresponding flags
async function checkFlagged(ids) {


}

module.exports = {
    startCheck (message, client) { return message.author.id === client.user.id; },
    checkMatch,
    update,
    formatNoTagging,
    formatSudoLink,
    sudoswapTagging,
    checkFlagged
}

