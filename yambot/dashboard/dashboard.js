// Importing stuff
const url = require('url')
const path = require('path')
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const strategy = require('passport-local').Strategy
const bodyParser = require('body-parser')
const ejs = require('ejs')
const Discord = require('discord.js')
const config = require('./config.json')
const prefix = require('./models/prefix')
require('dotenv').config()

const app = express() // Creating the express app
const MemoryStore = require('memorystore')(session) // Creating the session store

module.exports = async(client) => { // Exporting the function
    const dataDir = path.resolve(`${process.cwd()}${path.sep}`) // Absoulte path to this directory
    const templateDir = path.resolve(`${dataDir}${path.sep}templates`) // Absolute path to the template directory
    const assetsDir = path.resolve(`${dataDir}${path.sep}assets`) // Absolute path to the assets directory

    passport.serializeUser((user, done) => done(null, user)) // Serializing the user
    passport.deserializeUser((user, done) => done(null, user)) // Deserializing the user

    var callbackURL, domain // Creating the callback URL and domain variables

    try { // Checking if the callback URL is set
        const domainURL = new URL(config.domain) // Creating the URL object
        domain = { // Defining the domain variable
            host: domainURL.hostname, // Hostname
            protocol: domainURL.protocol // Protocol
        }
    } catch (e) { // If the callback URL is not set or is invalid
        console.log(e) // Log the error
        throw new TypeError('The callback URL is not set / is invalid') // Throw an error
    }

    if(config.usingCustomDomain) {
        callbackURL = `${domain.protocol}//${domain.host}/callback` // Setting the callback URL
    } else {
        callbackURL = `${domain.protocol}//${domain.host}${config.port == 80 ? "" : `${config.port}`}/callback` // Setting the callback URL
    }

    passport.use(new strategy({ // Using a passport strategy
        // Strategy configs
        clientID: config.clientID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: callbackURL,
        scope: ['identify', 'guilds']
    },
    (accessToken, refreshToken, profile, done) => { // Strategy callback
        process.nextTick(() => done(null, profile)) // Set the profile to the profile variable
    }))

    app.use(session({ // Using express-session
        store: new MemoryStore({ checkPeriod: 86400000 }), // Creating the session store with a check period of 1 day
        secret: process.env.SESSION_SECRET, // Setting the session secret
        resave: false, // Don't save the session if unmodified
        saveUninitialized: false // Don't create a session until something is stored
    }))

    app.use(passport.initialize()) // Initializing passport
    app.use(passport.session()) // Using passport session
    app.locals.domain = config.domain.split('//')[1] // Binding the domain

    app.engine('html', ejs.renderFile) // Using ejs for templating
    app.set('view engine', 'html') // Setting the view engine to ejs

    app.use(bodyParser.json()) // Using body-parser for parsing JSON
    app.use(bodyParser.urlencoded({ extended: true })) // Using body-parser for parsing URL encoded data

    app.use('/', express.static(assetsDir)) // Using express static for serving assets
   
    const renderTemplate = (res, req, template, data = { }) => { // Creating the render template function
        const baseData = { // Creating the base data variable
            bot: client, // Bot
            path: res.path, // Setting the path variable
            user: req.isAuthenticated() ? req.user : null // Checking if the user is authenticated
        }
        res.render(templatesDir, Object.assign(baseData, data)) // Rendering the template
    }

    const checkAuth = (res, req) => { // Creating the check auth function
        if(req.isAuthenticated()) return next() // If the user is authenticated, continue
        req.session.backURL = req.url // Setting the back URL
        res.redirect('/login') // Redirecting to the login page
    }

    app.get('/login', (req, res, next) => { // Getting the login page
        if(req.session.backURL) { // If there is a back URL
            req.session.backURL = req.session.backURL // Setting the back URL
        } else if(req.headers.referer){ // If there is a referer
            const parsed = url.parse(req.headers.referer) // Parsing the referer
            if(parsed.hostname === app.locals.domain) { // If the hostname is the same as the domain
                req.session.backURL = parsed.path // Setting the back URL
            }
        } else { // If there is no referer
            req.session.backURL = '/' // Setting the back URL to the root
        }
        next() // Continue
    }, passport.authenticate('discord')) // Using passport to authenticate the user

    app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => { // Getting the callback
        if(req.session.backURL) { // If there is a back URL
            const url = req.session.backURL // Setting the URL variable
            req.session.backURL = null // Removing the back URL
            res.redirect(url) // Redirecting to the URL
        } else { // If there is no back URL
            res.redirect('/') // Redirecting to the root
        }
    })

    app.get('/logout', function(req, res) { // Getting the logout page
        req.session.destroy(() => { // Destroying the session
            req.logout() // Logging out
            res.redirect('/') // Redirecting to the root
        })
    })

    app.get('/', (req, res) => { // Getting the root page
        renderTemplate(res, req, 'index.ejs') // Rendering the index template
    })

    app.get('/dashboard', checkAuth, (req, res) => { // Getting the dashboard page
        renderTemplate(res, req, 'dashboard.ejs', { perms: Discord.Permissions }) // Rendering the dashboard template
    })

    app.get('/dashboard/:guildID', checkAuth, async(req, res) => { // Getting the dashboard page
        const guild = await client.guilds.cache.get(req.params.guildID) // Getting the guild
        if(!guild) return res.redirect('/dashboard') // If the guild is not found
        let member = await guild.members.cache.get(req.user.id) // Getting the member
        if(!member) { // If the member is not found
            try { // Trying to get the member
                await guild.members.fetch() // Fetching the members
                member = await guild.members.cache.get(req.user.id) // Getting the member
            } catch (err) { // If an error occurs
                console.error('Can\'t fetch the members.') // Logging the error
            }
        }
        if(!member) return res.redirect('/dashboard') // If the member is not found
        if(!member.permissions.has("MANAGE_GUILD")) return res.redirect('/dashboard') // If the member doesn't have the manage guild permission
        
        var prefixes = await prefix.findOne({ guildID: guild.id }) // Getting the prefix
        if(!prefixes) {  // If the prefix is not found
            const newPrefix = new prefix.findOne({ guildID: guild.id }) // Creating the new prefix
            await newPrefix.save()
            prefixes = await prefix.findOne({ guildID: guild.id }) // Getting the prefix
        }
        renderTemplate(res, req, 'prefix.ejs', { guild, prefixes: prefixes, alert: null }) // Rendering the dashboard template
    })

    app.post('/dashboard/:guildID', checkAuth, async(req, res) => { // Posting the dashboard page
        const guild = await client.guilds.cache.get(req.params.guildID) // Getting the guild
        if(!guild) return res.redirect('/dashboard') // If the guild is not found
        let member = await guild.members.cache.get(req.user.id) // Getting the member
        if(!member) return res.redirect('/dashboard') // If the member is not found
        if(!member.permissions.has("MANAGE_GUILD")) return res.redirect('/dashboard') // If the member doesn't have the manage guild permission

        var prefixes = await prefix.findOne({ guildID: guild.id }) // Getting the prefix
        if(!prefixes) { // If the prefix is not found
            const newPrefix = new prefix.findOne({ guildID: guild.id }) // Creating the new prefix
            await newPrefix.save()
            prefixes = await prefix.findOne({ guildID: guild.id }) // Getting the prefix
        }
        
        prefixes.prefix = req.body.prefix // Setting the prefix
        await prefixes.save() // Saving the prefix
        renderTemplate(res, req, 'prefix.ejs', { guild, prefixes: prefixes, alert: { type: 'success', message: 'Prefix changed.' } }) // Rendering the dashboard template
    })
    
    app.listen(config.port, null, null, () => console.log('Dashboard is running!')) // Starting the server
}