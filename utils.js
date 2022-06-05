const Discord = require("discord.js");

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
    }
}

