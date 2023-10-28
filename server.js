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

if(process.env.LOCAL_MODE) {
    server.use(cors({
        origin: 'http://192.168.50.103:5173',
        credentials: true,
    }));
} else {
    server.use(cors({
        origin: 'https://linkd-dev.netlify.app',
        credentials: true,
    }));
}



server.use(cookieParser());

server.use(authMiddleware)

connectMongoDB()

server.use('/auth', require('./routes/auth'))
server.use('/user', require('./routes/user'))
server.use('/jobs', require('./routes/jobs'))




module.exports = server


