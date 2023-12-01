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

const excludeWebhookJsonMiddleware = (req, res, next) => {
    if (req.path.includes("webhook")) {
      next();
    } else {
      express.json()(req, res, next);
    }
  };

  const allowedCorsOrigins = ['https://dev.getlinkd.ink', 'https://linkd-dev.netlify.app']

if(process.env.LOCAL_MODE) {
    server.use(cors({
        origin: 'http://localhost:5173',
        credentials: true,
    }));
} else {
    server.use(cors({
        origin: allowedCorsOrigins,
        credentials: true,
    }));
}



server.use(cookieParser());

server.use(authMiddleware)
server.use(excludeWebhookJsonMiddleware)

connectMongoDB()

server.use('/auth', require('./routes/auth'))
server.use('/user', require('./routes/user'))
server.use('/jobs', require('./routes/jobs'))
server.use('/stripe', require('./routes/stripe'))




module.exports = server


