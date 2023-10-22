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
    origin: 'https://linkd-dev.netlify.app/',
    credentials: true,
}));


server.use(cookieParser());

server.use(authMiddleware)

connectMongoDB()

server.use('/auth', require('./routes/auth'))
server.use('/user', require('./routes/user'))


const PORT = process.env.port || 9001;
server.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}....`);
  });




