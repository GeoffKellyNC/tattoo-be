require("dotenv").config()
const express = require('express')
const server = express()
const cors = require('cors')


server.use(express.json())
server.use(cors({
    origin: '*',
    credentials: true,
}))




module.exports = server


