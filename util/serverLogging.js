const { mongo } = require('../db/config');


const db = mongo.db(process.env.MONGO_DB_NAME)


const logErrorToDB = async (error, req, user = null, customData) => {
    const logData = {
        timestamp: new Date(),
        error: {
            message: error.message,
            stack: error.stack
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            headers: req.headers,
            body: req.body
        },
        user_unxid: user ? user : "server",
        customData: customData || null
    };
}