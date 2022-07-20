const Discord = require("discord.js");
const fs = require("fs");
const chain = require("./chain");
const axios = require("axios");
// GLOBAL DATA
let freq = {}; // rarity dictionary
//let rawWizData = fs.readFileSync('WizAttributes.json');
//let wizData = JSON.parse(rawWizData);
let rawWarData = fs.readFileSync('WarAttributes.json');
let warData = JSON.parse(rawWarData);
const rarityPercentageDefault = .0039;
let numWarriors = warData.length;
let rarityRatio = numWarriors * rarityPercentageDefault;
let NFTXWarIDs;

processAttributes();

function processAttributes() {
    //freq = [];
    for (let attributes of warData) {
        for (let attribute of attributes) {
            if (freq[attribute.value] === undefined){
                freq[attribute.value] = 1
            }
            else{
                freq[attribute.value] += 1
            }
        }
    }
}

// export function parseCmd(message) {
//     let msg = message.content.toLowerCase();
//     // grab percentage of rarity
//     let percentage;
//     try{
//         percentage = msg.split('%')
//         percentage = percentage[1];
//     }
//     catch (e){}
//
//     switch (msg) {
//         case 'nftx warrior': {
//             await message.reply({
//                 content: 'Generating rarity for warriors, please wait...',
//             });
//             break;
//         }
//         case 'nftx wizard': {
//
//             break;
//         }
//         case 'update': {
//             await message.reply({
//                 content: 'Checking for updated warrior metadata..',
//             });
//             // do the update
//             await update()
//
//             await message.reply({
//                 content: 'Update complete. Run "nftx warrior %number" to see rarity',
//             });
//             break;
//         }
//         case 'help':{
//             await message.reply({
//                 content: 'maybe I will update help to actually be helpful',
//             });
//             break;
//         }
//         default: {
//             message.reply({
//                 content: 'Hey use the command correctly: like nftx wizard or nftx warrior',
//             });
//         }
//
//
//     }
// }
function checkMatch(NFTXWarIDs, rarity = rarityPercentageDefault) {
    rarityRatio = numWarriors * rarity;
    let rareWars = [];
    for (let i = 0; i < NFTXWarIDs.length; i++){
        // cross check if any values are sub .5% in rarity
        const checkedTraits = [
            'companion',
            'body',
            'head',
            'shield',
            'weapon',
            'rune'
        ]
        for (let properties of warData[NFTXWarIDs[i]]){
            //console.log(properties);
            if (checkedTraits.includes(properties['trait_type'])) {
                // if the frequency of this property value is less than the desired rarity (aka rarer), then spit out ID
                if (freq[properties['value']] < rarityRatio) {
                    let rarity = freq[properties['value']] / numWarriors * 100;
                    rarity = parseFloat(rarity).toFixed(3);
                    console.log(`Rare trait (rarity ${rarity} %): ${properties['value']} detected on ${NFTXWarIDs[i]}`)
                    rareWars.push({
                        id: NFTXWarIDs[i],
                        link: `https://nftx.io/vault/0xe218a21d03dea706d114d9c4490950375f3b7c05/${NFTXWarIDs[i]}/`,
                        property: properties['value'],
                        rarity: rarity
                    })
                }
            }
        }
    }
    return rareWars;
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

module.exports = {
    startCheck(message, client) {
        return message.author.id === client.user.id;
    },
    formatNFTEmbed(data){
        // let embed = new Discord.MessageEmbed()
        //     .setColor("#92BA2F")
        //     .setDescription("some description");
        // data.forEach(nft =>{
        //     embed.addField('Results', `ID: ${nft.id}, Link: ${nft.link}, Trait: ${nft.property}, Rarity: ${nft.rarity}%`, true)
        // })
        // return embed;
        let result = 'Results:\n';
        data.forEach(nft =>{
            result = result.concat(`ID: ${nft.id}, Link: [NFTX](${nft.link}), Trait: ${nft.property}, Rarity: ${nft.rarity}%\n`)
        })
        return result;
    },
    checkMatch,
    update
}

