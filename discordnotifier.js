const {Client, Intents} = require("discord.js");
const utils = require("./utils.js");
const chain = require('./chain');
const rarityPercentageDefault = .0039;
let NFTXWarIDs, numWarriors;

// Discord channels
const TEST_CHANNEL = '954491837920469033';
const BOT_CHANNEL = '980974479918395402';

// Discord tags
const VAULT_SNIPER = '999350929012834384';


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

    if (isNaN(percentage)){
        percentage = rarityPercentageDefault;
    }

    switch (msg) {
        case 'nftx warrior': {
            NFTXWarIDs = await chain.getNFTXWarriors();
            //NFTXWarIDs = ['8366']
            let data = utils.checkMatch(NFTXWarIDs, percentage)
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
            await utils.update()

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

async function postMessage(msg) {
    console.log(msg);
    client.channels.cache.get(BOT_CHANNEL).send(`${msg}`)
}


module.exports = {
    postMessage,
}
