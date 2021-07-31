const mongoose = require('mongoose') // Importing mongoose

const prefixSchema = new mongoose.Schema({ // Creating a schema
    // Schema variables
    guildID: String,
    prefix: { type: String, default: '!' }
})

const prefix = mongoose.model('prefix', prefixSchema) // Creating the model
module.exports = prefix // Exporting the model