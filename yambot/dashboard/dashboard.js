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
}