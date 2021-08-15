const dotenv = require('dotenv').config();
const { Client, Intents } = require('discord.js');
const fetch = require('node-fetch');
var Datastore = require('nedb')
  , db = new Datastore({ filename: './professions.db', autoload: true });

const client = new Client({ intents: [Intents.FLAGS.GUILDS , Intents.FLAGS.GUILD_MESSAGES]});
const professions = [
    'engineering',
    'enchanting',
    'blacksmithing',
    'jewelcrafting',
    'tailoring',
    'leatherworking',
    'cooking',
    'mining',
    'alchemy'
]

client.once('ready', () => {
	console.log('Ready!');
});

client.on('messageCreate', async msg => {
    if (msg.author.bot) return;
    let attachmentText = "";
    if (msg.attachments.size > 0) {
        console.log('found attachment');
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
            msg.channel.send(`${msg.author.username}: Something went wrong - send feet pics to Elemenoh to investigate this issue`);
            msg.delete();
        }
    }

    if (msg.content.split(' ')[0] === 'import') {
        console.log(`Importing ${msg.author.username} data`)
        let importData = msg.content.split(' ');
        importData.shift();
        // if (msg.attachments.size > 0) {
        //     var file = msg.attachments.first().url
        //     try {
            
        //         // fetch the file from the external URL
        //         const response = await fetch(file);
            
        //         // if there was an error send a message with the status
        //         if (!response.ok) {
        //             msg.delete();
        //             return msg.channel.send(
        //                 'There was an error with fetching the file:',
        //                 response.statusText,
        //             );
        //         }
            
        //         // take the response stream and read it to completion
        //         const text = await response.text();
            
        //         if (text) {
        //             //for when an import is just not big enough 
        //             // if (text.substring(0,6)) {
        //             //     text.slice(6,text.length);
        //             // }
        //             dbInsertData(msg, text);
        //             // db.insert(JSON.parse(text));
        //             // msg.delete();
        //             // msg.channel.send(`Imported ${JSON.parse(text).player} professions`);
        //         }
        //     } catch (error) {
        //         console.log(error);
        //         msg.channel.send(`${msg.author.username}: Something went wrong - send feet pics to Elemenoh to investigate this issue`);
        //         msg.delete();
        //     }
        // } else {
        try {
            console.log('ZZZ WHAT AM I Zzz', importData);
            if (importData.length > 0) dbInsertData(msg, importData.join(' '))
            // db.insert(JSON.parse(importData.join(' ')));
            // msg.channel.send(`Imported ${JSON.parse(importData.join(' ')).player}'s professions`);
            // msg.delete();
        }   
        catch (error) {
            console.log(`${msg.author.username} import failed:`, error)
            msg.channel.send(`${msg.author.username}: Something went wrong - send feet pics to Elemenoh to investigate this issue`);
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
        var recipe = data.join(' ');
        var regex = new RegExp(recipe,'ig')
        db.find({'$or' : professions.map(profession => {
            //already forgot how this shit worked
            let obj = {}
            obj[profession] = regex
            return obj
            })}, (err, docs) => {
                let response = '';
                let foundRecipe = false
                let crafters = formatResults(docs,regex)
                Object.keys(crafters).forEach(profession => {
                    if (!(crafters[profession] && Object.keys(crafters[profession]).length === 0 && crafters[profession].constructor === Object)) response += `= ${profession.toUpperCase()} =\n`
                    Object.keys(crafters[profession]).forEach(recipe => {
                        foundRecipe = true
                        
                        response += `${recipe} :: ${crafters[profession][recipe].join(', ')} \n`
                    })
                    response += '\n'
                })
                if (response.length > 3950) {
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
    // console.log(data)
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
        console.log(docs);
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
    })
}

client.login(process.env.TOKEN);
