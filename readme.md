# Profession Tracker for WoW Classic

## Description
This bot is intended to allow players to import their professions into the discord bot. This uses a local version of a Mongo-lite type DB, [NeDB](https://github.com/louischatriot/nedb) (no longer supported, so feel free to modify as you see fit for your own uses, this just worked for what I needed it to). This will create a new file in the local directory of the bot and save the data in a text file. 

- Users can import their professions.
- Users can search by pattern or recipe name via `search` command. 
- As users get new recipes and wish to update, they may re-copy a new import string and it will update their info in the local database.

## Bot Requirements
- Node v16.6+ 
- npm v7.2+ 
- These are what versions this was built on - so just be sure it's at least these versions

## Instructions
- Clone repo
- create a .env file (will need to add your bot's token from the next category into this file.)
- `npm install` to install npm packages
- `node index.js` to run the bot

## Connecting to Discord
- Create bot via [Discord Development Portal](https://discord.com/developers/applications)
- Click `New Application` and give it a name
- Under OAuth2 section
  - Under 'Client Secret', select copy and add it to your .env file like this
    - `TOKEN=botsecrettoken`
  - Generate invite link
    - Select "bot" in the scope category
    - Select "Send Messages", "Read Message History", and "Manage Messages". You may exclude manage messages, but without it, the bot won't be able to delete the import message and may leave additional bloat in the channel. 
    - Copy the link provided, and invite the bot to your server. 

## WoW Addon
- provided is `ProfessionBotExporter`. This is an addon meant to allow users to create an export string from their client to copy/paste into the bot's channel. This was modified from [Profession BOT - Exporter](https://www.curseforge.com/wow/addons/profession-bot-exporter) to fit the needs of this bot. 
- Install to addon directory, open profession or tradeskill, and type /prof to generate import string. copy/paste into channel, and done. 