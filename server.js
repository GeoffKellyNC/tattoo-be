require("dotenv").config();
const express = require('express');
const server = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { connectMongoDB } = require('./db/config');
const authMiddleware = require('./middleware/authMiddleware');
const socketService = require('./services/socketService');

// CORS and helmet setup
if (process.env.ENV_TYPE === 'production') {
    console.log('RUNNING PRODUCTION');
    server.use(helmet());
} else {
    console.log("RUNNING DEVELOPMENT");
}

const allowedCorsOrigins = ['https://dev.getlinkd.ink', 'https://linkd-dev.netlify.app', 'http://localhost:5173', 'https://getlinkd.ink'];
if (process.env.LOCAL_MODE) {
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
server.use(authMiddleware);

// Exclude webhook JSON middleware (if needed)
const excludeWebhookJsonMiddleware = (req, res, next) => {
    if (req.path.includes("webhook")) {
        next();
    } else {
        express.json()(req, res, next);
    }
};
server.use(excludeWebhookJsonMiddleware);

connectMongoDB();

// Routes
server.use('/auth', require('./routes/auth'));
server.use('/user', require('./routes/user'));
server.use('/jobs', require('./routes/jobs'));
server.use('/stripe', require('./routes/stripe'));
server.use('/ai', require('./routes/ai'));

const httpServer = http.createServer(server);

// Integrate Socket.IO with the HTTP server
const io = new Server(httpServer, {
    cors: {
        origin: allowedCorsOrigins, 
        credentials: true
    }
});

// Socket.IO connection logic
io.on('connection', (socket) => {
    const unx_id = socket.handshake.query.unx_id;

    if (unx_id) {
        socketService.registerSocket(unx_id, socket);

        // setInterval(() => {
        //     socketService.emitToUser(unx_id, "notification", { message: "This is a test notification", type: 'info' })
        // }, 5000) // 5 seconds;

        socket.on('disconnect', () => {
            console.log("User disconnected: ", unx_id) //!REMOVE
            socketService.unregisterSocket(unx_id);
        });

    } else {
        console.log("unx_id not provided"); //!REMOVE
        socket.disconnect(); // Disconnect if unx_id is not provided
    }
});

// Export the HTTP server
module.exports = httpServer;
