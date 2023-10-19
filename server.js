require("dotenv").config()
const express = require('express')
const server = express()
const cors = require('cors')
const { connectMongoDB } = require('./db/config')
const helmet = require('helmet')
const authMiddleware = require('./middleware/authMiddleware')
const cookieParser = require('cookie-parser');



if (process.env.ENV_TYPE === 'production'){
    console.log('RUNNING PRODUCTION')
    server.use(helmet())
}else{
    console.log("RUNNING DEVELOPMENT")
}


server.use(express.json())
server.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
server.use(cookieParser());

server.use(authMiddleware)

connectMongoDB()

server.use('/auth', require('./routes/auth'))
server.use('/user', require('./routes/user'))




module.exports = server


