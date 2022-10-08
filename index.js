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
let maxMessageLength = 2000 //change this to lower if non-nitro server

//change to who is running the bot for the error messages
const botOwner = 'Elemenoh';

client.once('ready', () => {
    console.log('Ready!aaaa');
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
    } else if (msg.content === 'enchanters') {
        db.find({'enchanting' : {'$exists':true}}, (err, docs) => {
            var enchanters = [];
            docs.map(enchanter => enchanters.push(enchanter.player));
            msg.reply('Enchanters: ' + enchanters.join(','))
        })
    } else if (msg.content.split(' ')[0] === 'search') {
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

    //create keys on main return object
    professions.map(profession => crafterList[profession] = {})
    crafters.map(player => {
        professions.map(profession => {
            if (player[profession]) {
                let recipes = player[profession].filter((i) => i.match(search))
                recipes.forEach(recipe => {
                    crafterList[profession][recipe] = (crafterList[profession][recipe]) ? [].concat(crafterList[profession][recipe],player.player) : [].concat(player.player);
                })
            }          
        })     
    })
    return crafterList;
    // return {
    //     'profession' : [
    //         {'Recipe' : ['Crafter','Crafter']},
    //         {'Recipe' : ['Crafter','Crafter']},
    //         {'Recipe' : ['Crafter','Crafter']},
    //     ],
    //     'profession' : [
    //         {'Recipe' : ['Crafter','Crafter']},
    //         {'Recipe' : ['Crafter','Crafter']},
    //         {'Recipe' : ['Crafter','Crafter']},
    //     ]
    // }
}

dbInsertData = (msg, data) => {
    let profession = '';
    let existingId = '';
    let isUpdate = false;
    
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
    db.find({}, (err,docs) => {
        if (err) 
        {
            console.log(err)
            return
        }
        (docs).forEach(player => {
            //add professions from current db values
            Object.keys(player).forEach(prof => {
                if (prof != 'player' && prof != '_id') 
                {
                    if (!professions.includes(prof)) professions.push(prof);
                }
            })
        })
    })
    console.log('done loading');
}

client.login(process.env.TOKEN);
