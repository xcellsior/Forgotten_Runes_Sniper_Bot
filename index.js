const {Client, Intents} = require ('discord.js');
const axios = require('axios');
const fs = require("fs");
const utils = require('./utils.js');
require('dotenv').config()
const chain = require('./chain');

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

const client = new Client({
    intents:[
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
    }
);

client.on('ready', () =>{
    console.log('bot is armed and ready');
})



client.on('messageCreate', async (message) => {
    if (utils.startCheck(message, client)){
        return;
    }

    //const reply = utils.parseCmd(message)

    let msg = message.content.toLowerCase();
    // grab percentage of rarity
    let percentage;
    try{
        msg = msg.split('%')
        msg[1] = msg
        percentage = msg[1] / 100;
        msg = msg[0];
        msg = msg.trim();
    }
    catch (e){}

    switch (msg) {
        case 'nftx warrior': {
            let data = checkMatch(NFTXWarIDs, percentage)
            const result = utils.formatNFTEmbed(data);
            await message.reply({
                content: result
            });
            //await message.channel.send({embeds: [embed]})
            break;
        }
        case 'nftx wizard': {

            break;
        }
        case 'update': {
            await message.reply({
                content: `Checking for updated warrior metadata.. Last updated ID ${numWarriors-1}`,
            });
            // do the update
            await update()

            await message.reply({
                content: `Update complete. I now have data up to ID ${numWarriors-1}`,
            });
            break;
        }
        case 'help':{
            await message.reply({
                content: 'maybe I will update help to actually be helpful',
            });
            break;
        }
        case 'info':{
            await message.reply({
                content: `I have data on Warriors up to ID ${numWarriors-1}.\n
                          If you want a list of commands, bug  to actually update the help function`,
            });
            break;
        }
        default: {
            // await message.reply({
            //     content: 'Hey use the command correctly: like nftx wizard or nftx warrior',
            // });
        }


    }

    if (message.content.toLowerCase() === 'nftx warrior') {
        //console.log('im gonnnaaaa pong')


    }
})

client.login(process.env.TOKEN)



main();

async function chainMonitor() {
    let alert = await chain.NFTXevents();
    if (alert){
        // post a discord message with our findings
    }
}

async function main(){
    // await getTraitsJson();
    await processAttributes();
    NFTXWarIDs = await chain.getNFTXWarriors();
    console.log(NFTXWarIDs.length)
    //await checkMatch(NFTXWarIDs);
    // start a thread to subscribe to events on NFTX
    await chainMonitor()
}


// TODO process Wiz attributes
// also needs rarity resample on update
async function processAttributes() {
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

/*

TODO Add a configuration setting for rarities. 

 */
function checkMatch(NFTXWarIDs, rarity = rarityPercentageDefault) {
    rarityRatio = numWarriors * rarity;
    let rareWars = [];
    for (let i = 0; i < NFTXWarIDs.length; i++){
        if(NFTXWarIDs[i] > numWarriors)
        {
            continue;
        }
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
        for (let i = numWarriors; i < totalWarriors - 1; i++) {
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