// Importing stuff
const Discord = require('discord.js')
const mongoose = require('mongoose')
const config = require('./config.json')
const dashboard = require('./dashboard.js')
require('dotenv').config()

const client = new Discord.Client({ ws: { intents: [ "GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES" ] } }) // Creates a new discord client, with intents to see server members and messages.

mongoose.connect(process.env.MONGOURI, { // Connects to the mongodb database.
    // MongoDB Configs
    useNewUrlParser: true,
    useUnifiedTopology: true
})

client.on('ready', async() => { // This will get emitted when the discord client is ready.
    for(const [ id, guild ] of client.guilds.cache) { // For every guild in the cache.
        await guild.members.fetch() // Fetch the members of the guild.
    }
    console.log('Fetched all the members') // Logs that the members have been fetched.

    console.log(`${client.user.username} is ready! Found ${client.guilds.cache.size} guilds and ${client.users.cache.size} users.`) // Logs that the bot is ready.
    dashboard(client) // Calls the dashboard function.
})

client.login(process.env.TOKEN) // Logs in to the discord bot.