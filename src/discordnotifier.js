const {Client, Intents, MessageEmbed, MessageAttachment} = require("discord.js");
const utils = require("./utils.js");
const chain = require('./chain');
const rarityPercentageDefault = .0039;
let NFTXWarIDs, numWarriors, NFTXWizIDs;

// Discord channels
const TEST_CHANNEL = '977626034864259152';
const BOT_CHANNEL = '980974479918395402';
const ALERTS_CHANNEL = '1054502938409697291';

// Discord tags
const VAULT_SNIPER = '999350929012834384';
const ME = '229033492707672065';

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
    let number;
    try{
        number = msg.split('!');
        number = number[1];
        msg = '!';
    }
    catch (e){}


    switch (msg) {
        case 'nftx warrior': {
            NFTXWarIDs = await chain.getNFTXWarriors();
            //NFTXWarIDs = ['8366']
            let data = utils.checkMatch(NFTXWarIDs, percentage)
            const result = await utils.formatNoTagging(data);
            await message.reply({
                content: result
            });
            //await message.channel.send({embeds: [embed]})
            break;
        }
        case 'nftx wizard': {
            NFTXWizIDs = await chain.getNFTXWizards();
            let data = utils.checkMatch(NFTXWizIDs, 'wizards', percentage)
            const result = await utils.formatNoTagging(data);
            await message.reply({
                content: result
            });
            //await message.channel.send({embeds: [embed]})
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
        case '!':{


            // const exampleImage = new MessageAttachment(`./warimages/${number}.png`);
            //
            // const exampleEmbed = new MessageEmbed()
            //     .setColor('#0099ff')
            //     .setTitle('CLICK TO GO TO [SUDOSWAP]')
            //     .setDescription(`ID: ${number}, Rare trait: TBD`)
            //     .setURL(`https://sudoswap.xyz/#/item/0x521f9C7505005CFA19A8E5786a9c3c9c9F5e6f42/${number}`)
            //     .setImage(`attachment://${number}.png`)
            //
            // await message.reply({ embeds: [exampleEmbed], files: [exampleImage] });

            // let msg = `<@${'229033492707672065'}> I found a rare in the vault: \n`;
            // client.channels.cache.get('977626034864259152').send(`${msg}`);
            //
            // let data = [{ id: number,
            //     link: `https://nftx.io/vault/0xe218a21d03dea706d114d9c4490950375f3b7c05/${number}/`,
            //     property: 'The yeetus',
            //     rarity: .00001
            // }];
            // let collection = 'wizards'
            //
            // let nftsById = {};
            // data.forEach(nft =>{
            //     if (!nftsById[nft.id]) {
            //         // If we haven't seen an NFT with this ID yet, create a new entry in the object
            //         nftsById[nft.id] = {
            //             id: nft.id,
            //             link: nft.link,
            //             property: nft.property,
            //             rarity: nft.rarity
            //         };
            //     }
            //     else {
            //         // If we've seen an NFT with this ID before, add the link to the existing entry and update the rarity
            //         nftsById[nft.id].property += `, ${nft.property}`
            //         if (nft.rarity < nftsById[nft.id].rarity) {
            //             nftsById[nft.id].rarity = nft.rarity; //only display rarest trait %
            //         }
            //     }
            //     //result += Object.values(nftsById).map(nft => `ID: ${nft.id}, Trait(s): ${nft.property}, Rarest trait: ${nft.rarity}%\n`).join('');
            // })
            // // for each object in nftsById make a post to channel with embed
            // for (const nft of Object.values(nftsById)) {
            //     const NFTImage = new MessageAttachment(`./${collection}/${nft.id}.png`);
            //     const Url = new URL(nft.link)
            //     const base = Url.hostname.split('.')[0]; // should just spit out "sudoswap" or "nftx"
            //     const Embed = new MessageEmbed()
            //         .setColor('#0099ff')
            //         .setTitle(`Click here to go to ${base}`)
            //         .setDescription(`ID: ${nft.id}, Rare trait(s): ${nft.property}. \nRarest trait: ${nft.rarity}%`)
            //         .setURL(`${nft.link}`)
            //         .setImage(`attachment://${nft.id}.png`)
            //     //await client.channels.cache.get('977626034864259152').send({ embeds: [Embed], files: [NFTImage] });
            //     await postMessage({embeds: [Embed], files: [NFTImage]})
            // }
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


// possible todo rename this to postAlert and have a standalone postmsg
async function postMessage(msg, alertMe = true) {
    console.log(msg);
    //client.channels.cache.get(BOT_CHANNEL).send(`${msg}`);
    await client.channels.cache.get(ALERTS_CHANNEL).send(msg);

    // todo possibly email or other notification(s)
    // if (alertMe) {
    //     client.users.get(ME).send(msg);
    //     client.users.get(ME).send(msg);
    //     client.users.get(ME).send(msg);
    //     client.users.get(ME).send(msg);
    // }
}
async function postMessageDebug(msg) {
    console.log(msg)

}

async function formatNFTEmbed(data, collection) {
    //let result = `<@&${VAULT_SNIPER}> I found a rare in the vault: \n`;
    await client.channels.cache.get(ALERTS_CHANNEL).send(`<@&${VAULT_SNIPER}> I found a rare in the vault: \n`);
    let nftsById = {};
    data.forEach(nft =>{
        if (!nftsById[nft.id]) {
            // If we haven't seen an NFT with this ID yet, create a new entry in the object
            nftsById[nft.id] = {
                id: nft.id,
                link: nft.link,
                property: nft.property,
                rarity: nft.rarity
            };
        }
        else {
            // If we've seen an NFT with this ID before, add the link to the existing entry and update the rarity
            nftsById[nft.id].property += `, ${nft.property}`
            if (nft.rarity < nftsById[nft.id].rarity) {
                nftsById[nft.id].rarity = nft.rarity; //only display rarest trait %
            }
        }
        //result += Object.values(nftsById).map(nft => `ID: ${nft.id}, Trait(s): ${nft.property}, Rarest trait: ${nft.rarity}%\n`).join('');
    })
    // for each object in nftsById make a post to channel with embed
    for (const nft of Object.values(nftsById)) {
        const NFTImage = new MessageAttachment(`./${collection}/${nft.id}.png`);
        const URL = new URL(nft.link)
        const base = URL.hostname.split('.')[0]; // should just spit out "sudoswap" or "nftx"
        const Embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Click here to go to ${base}`)
            .setDescription(`ID: ${nft.id}, Rare trait(s): ${nft.property}. \nRarest trait: ${nft.rarity}%`)
            .setURL(`${nft.link}`)
            .setImage(`attachment://${nft.id}.png`)

        await postMessage({ embeds: [Embed], files: [NFTImage] })
    }
}


module.exports = {
    formatNFTEmbed,
    //postMessage,
}
