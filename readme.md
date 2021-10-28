# Profession Tracker for WoW Classic

## Description
This bot is intended to allow players to import their professions into the discord bot. This uses a local version of a Mongo-lite type DB, [NeDB](https://github.com/louischatriot/nedb) (no longer supported, so feel free to modify as you see fit for your own uses, this just worked for what I needed it to). This will create a new file in the local directory of the bot and save the data in a text file. 

- Users can import their professions.
- Users can search by pattern or recipe name via `search` command. 
- As users get new recipes and wish to update, they may re-copy a new import string and it will update their info in the local database.

## Bot Requirements
- Node v16.6+ (confirmed needs to be latest version, 16.6 otherwise you will run into errors when trying to start the bot)
- npm v7.2+ 
- These are what versions this was built on - so just be sure it's at least these versions

## Instructions
- Clone repo
- create a .env file (will need to add your bot's token from the next category into this file.)
- `npm install` to install npm packages
- Modify the `const botOwner = 'Elemenoh';` in the top of index.js to your own name for error messages. 
- `node index.js` to run the bot (must finish below section before this step)
- Bot must remain running in your command line to function. Leave running on an extra computer, or look at something like digital ocean for a $5 droplet per month to host it on if you do not want to run it yourself. W

## Connecting to Discord
- Create bot via [Discord Development Portal](https://discord.com/developers/applications)
- Click `New Application` and give it a name
- Under OAuth2 section
  - Under 'Client Secret', select copy and add it to your .env file like this
    - `TOKEN=botsecrettoken`
  - Generate invite link
    - Select "bot" in the scope category
    - Don't give any permissions yet - you don't want it to see any channels except the profession channel you dedicate to it. 
    - Copy the link provided, and invite the bot to your server. 
    - Add a custom permission override for the bot to view your channel - giving it manage message (to delete imports), read message history, view channel, and send message.

## WoW Addon
- provided is `ProfessionBotExporter`. This is an addon meant to allow users to create an export string from their client to copy/paste into the bot's channel. This was modified from [Profession BOT - Exporter](https://www.curseforge.com/wow/addons/profession-bot-exporter) to fit the needs of this bot. 
- Install to addon directory, open profession or tradeskill, and type /prof to generate import string. copy/paste into channel, and done. 
