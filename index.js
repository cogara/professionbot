const dotenv = require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');
var Datastore = require('nedb')
  , db = new Datastore({ filename: './professions.db', autoload: true });

const client = new Client({ 
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
});

let professions = []
let specialites = {}
let maxMessageLength = process.env.MESSAGELENGTH //change this to lower if non-nitro server

//change to who is running the bot for the error messages
const botOwner = process.env.OWNER;

client.once('ready', () => {
    console.log('Ready!');
    loadProfessions();
    // db.find({}, (err,docs) => {
    //     if (err) 
    //     {
    //         console.log(err)
    //         return
    //     }
    //     (docs).forEach(player => {
    //         //add professions from current db values
    //         Object.keys(player).forEach(prof => {
    //             if (prof != 'player' && prof != '_id') 
    //             {
    //                 if (!professions.includes(prof)) professions.push(prof);
    //             }
    //         })
    //     })
    // })
});



client.on('messageCreate', async msg => {
    if (msg.author.bot) return;
    let attachmentText = "";
    if (msg.attachments.size > 0) {
        let file = msg.attachments.first().url;
        try {
            //get file contents
            const response = await fetch(file);
            let msgText = msg.content.split(' ');
            let isImport = false;
            //if error, send message with status
            if (!response.ok) {
                msg.delete(); 
                return msg.channel.send(
                    'There was an error reading the attachment file:', response.statusText
                );
            }

            let attachmentText = await response.text();
            //remove "import" from attachment text in the weird case where the initial data too long
            
            if (attachmentText.substring(0,6) == 'import') {
                attachmentText = attachmentText.slice(6,attachmentText.length)
                isImport = true;
            }
            if (msgText && msgText[0] === 'import') {
                msgText.shift();
                isImport = true
            }
            if (isImport) dbInsertData(msg, attachmentText);
            else msg.channel.send('invalid data');
        }
        catch (error) {
            console.log(`${msg.author.username} failed import:`, error);
            msg.channel.send(`${msg.author.username}: Something went wrong - send feet pics to ${botOwner} to investigate this issue`);
            msg.delete();
        }
    }

    if (msg.content.split(' ')[0] === 'import') {
        let importData = msg.content.split(' ');
        importData.shift();
        try {
            if (importData.length > 0) dbInsertData(msg, importData.join(' '))
            // db.insert(JSON.parse(importData.join(' ')));
            // msg.channel.send(`Imported ${JSON.parse(importData.join(' ')).player}'s professions`);
            // msg.delete();
        }   
        catch (error) {
            console.log(`${msg.author.username} import failed:`, error)
            msg.channel.send(`${msg.author.username}: Something went wrong - send feet pics to ${botOwner} to investigate this issue`);
            msg.delete();
        }
        // }
    } else if ((`${msg.content.split(' ')[0]} ${msg.content.split(' ')[1]}`).toLocaleLowerCase() === 'set main') {
        var data = msg.content.split(' ');
        data.shift();
        data.shift();
        if (data.length == 2) {
            db.update(
                { player: data[0] }, 
                { $set: { mainName : data[1] }},
                { multi: true},
                (err, numUpdated) => {
                    console.log(`added ${data[1]} as a main for ${data[0]} in ${numUpdated} rows`)
                }
            )
            msg.delete();
            msg.channel.send(`Added '${data[1]}' as a main for '${data[0]}'`)
        } else {
            msg.channel.send('Invalid format. Must be `set main Altname Mainname`')
        }
    } else if ((`${msg.content.split(' ')[0]} ${msg.content.split(' ')[1]} ${msg.content.split(' ')[2]}`).toLocaleLowerCase() === 'set potion master') {
        var data = msg.content.split(' ');
        data.shift();
        data.shift();
        data.shift();
        if (data.length == 1) {
            db.find(
                {player: data[0], 'alchemy': {$exists: true}},
                (err, docs) => {
                    if (docs.length > 0) {
                        db.update(
                            { _id: docs[0]._id }, 
                            { $set: { potionMaster : true }},
                            { multi: true},
                            (err, numUpdated) => {
                                console.log(`added ${data[0]} as a potion master`)
                                msg.delete();
                                msg.channel.send(`Added ${data[0]} as a potion master`)
                            }
                        )
                    } else {
                        msg.channel.send(`${data[0]} not listed as alchemist`)
                    }
                }
            )
        } else {
            msg.channel.send('Invalid format. Must be `set potion master player`')
        }
    } else if ('potion masters'.match(msg.content.toLocaleLowerCase())) {
        db.find({ potionMaster : true}, (err, docs) => {
            var potionMasters = [];
            docs.map(alchemist => potionMasters.push(alchemist.player));
            msg.reply('Potion Masters: ' + potionMasters.join(', '))
    })
    } else if ((`${msg.content.split(' ')[0]} ${msg.content.split(' ')[1]} ${msg.content.split(' ')[2]}`).toLocaleLowerCase() === 'set elixir master') {
        var data = msg.content.split(' ');
        data.shift();
        data.shift();
        data.shift();
        if (data.length == 1) {
            db.find(
                {player: data[0], 'alchemy': {$exists: true}},
                (err, docs) => {
                    if (docs.length > 0) {
                        db.update(
                            { _id: docs[0]._id }, 
                            { $set: { elixirMaster : true }},
                            { multi: true},
                            (err, numUpdated) => {
                                console.log(`added ${data[0]} as a elixir master`)
                                msg.delete();
                                msg.channel.send(`Added ${data[0]} as a elixir master`)
                                loadProfessions();
                            }
                        )
                    } else {
                        msg.channel.send(`${data[0]} not listed as alchemist`)
                    }
                }
            )
        } else {
            msg.channel.send('Invalid format. Must be `set elixir master player`')
        }
    } else if ('elixir masters'.match(msg.content.toLocaleLowerCase())) {
        db.find({ potionMaster : true}, (err, docs) => {
            var masters = [];
            docs.map(alchemist => masters.push(alchemist.player));
            msg.reply('Elixir Masters: ' + masters.join(', '))
    })
    } else if (msg.content.toLocaleLowerCase() === 'enchanters') {
        db.find({'enchanting' : {'$exists':true}}, (err, docs) => {
            var enchanters = [];
            docs.map(enchanter => enchanters.push(enchanter.player));
            msg.reply('Enchanters: ' + enchanters.join(','))
    })
    } else if (msg.content.split(' ')[0].toLocaleLowerCase() === 'search') {
        var data = msg.content.split(' ');
        data.shift();
        var recipe = data.join('.*');
        var regex = new RegExp(recipe,'ig')
        db.find({'$or' : professions.map(profession => {
            //loop through professions to find if any recipe matches search terms
            let obj = {}
            obj[profession] = regex
            return obj
            })}, (err, docs) => {
                let response = '';
                let foundRecipe = false
                let crafters = formatResults(docs,regex)
                Object.keys(crafters).forEach(profession => {
                    if (!(crafters[profession] && Object.keys(crafters[profession]).length === 0 && crafters[profession].constructor === Object)) response += `\n= ${profession.toUpperCase()} =\n`
                    Object.keys(crafters[profession]).forEach(recipe => {
                        foundRecipe = true
                        
                        response += `${recipe} :: ${crafters[profession][recipe].join(', ')} \n`
                    })
                    if (profession === 'alchemy' && Object.keys(crafters[profession]).length > 0) {
                        if (specialites.potion.length > 0 || specialites.elixir.length > 0) {
                            response += `\n`
                        }
                        if (specialites.potion.length > 0) {
                            response += `Potion Masters :: ${specialites.potion.join(', ')} \n`;
                        }
                        if (specialites.elixir.length > 0) {
                            response += `Elixir Masters :: ${specialites.elixir.join(', ')} \n`;
                        }
                    }
                    
                })
                if (response.length > maxMessageLength) {
                    msg.channel.send('Search term is too broad - please narrow and try again')
                    return
                }
                if (foundRecipe) msg.channel.send(`\`\`\`asciidoc\n${response}\`\`\``);
                else msg.channel.send(`\`\`\`asciidoc\n[No Crafters found for ${recipe} - lazy Garys]\`\`\``)
        })
	} 
});


formatResults = (crafters, search) => {
    let crafterList = {}
    // console.log('professions', professions);
    //create keys on main return object
    professions.map(profession => crafterList[profession] = {})
    crafters.map(player => {
        professions.map(profession => {
            if (player[profession]) {
                // console.log(profession);
                let recipes = player[profession].filter((i) => i.match(search))
                recipes.forEach(recipe => {
                    let playerName = (player.mainName) ? `${player.player} (${player.mainName})` : player.player // add main to an alt's name if exist
                    crafterList[profession][recipe] = (crafterList[profession][recipe]) ? [].concat(crafterList[profession][recipe], playerName) : [].concat(playerName);
                })
            }          
        })     
    })
    return crafterList;
}

dbInsertData = (msg, data) => {
    let profession = '';
    let existingId = '';
    let isUpdate = false;

    data = data
        .replace('"S"',"S")
        .replace('"other dumb double quote BS"','fixed double quote bs')
    
    professions.map(prof => {
        if (JSON.parse(data)[prof]) {
            profession = prof;
        }

    })
    console.log('updating', profession);
    db.find({
        'player': JSON.parse(data).player,
        [profession] : {
            $exists : true
        }
    }, (err,docs) => {
        if (docs[0]) {
            existingId = docs[0]._id;
            console.log('ID to remove: ', existingId)
            isUpdate = true;
            db.remove({_id: existingId},{},(err, numRemoved) => {
            console.log('replaced', numRemoved, 'records');  
            })
        }
        db.insert(JSON.parse(data));
        msg.delete();
        msg.channel.send(`${(isUpdate) ? 'Updated' : 'Inserted'} ${JSON.parse(data).player} professions`);
        loadProfessions();
    })
}

loadProfessions = () => {
    professions = [];
    specialites = {
        elixir: [],
        potion: []
    }
    db.find({}, (err,docs) => {
        if (err) 
        {
            console.log(err)
            return
        }
        (docs).forEach(player => {
            //add professions from current db values
            Object.keys(player).forEach(prof => {
                // console.log(prof);
                if (prof !== '_id' && prof !== 'player' && prof !== 'mainName' && prof !== 'potionMaster' && prof !== 'elixirMaster') {
                    if (!professions.includes(prof)) professions.push(prof);
                }
                else {
                    if (prof === 'potionMaster') {
                        specialites.potion.push(player.player);
                    }
                    if (prof === 'elixirMaster') {
                        specialites.elixir.push(player.player);
                    }
                }
            })
        })
    })
    console.log('done loading');
}

client.login(process.env.TOKEN);
