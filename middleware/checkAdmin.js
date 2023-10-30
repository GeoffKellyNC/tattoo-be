const jwt = require('jsonwebtoken');
const Auth = require('../models/Auth');



async function checkAdminMiddleware(req, res, next) {
    try {
        const formatedDate = new Date(Date.now()).toLocaleString('en-US', { timeZone: 'America/New_York' });
        console.log(`
            Route Hit!
            Current time: ${formatedDate}
            req.path: ${req.path}
        `)

        const jwtToken = req.headers['auth-token']
        const user_unxid = req.headers['user_unx_id']

        const decoded_data = await Auth.verifyJWT(jwtToken)

        if (!jwtToken || !user_unxid) {
            return res.status(401).json({ message: 'Access Denied. No token provided.' });
        }

        if(decoded_data.user_unx_id !== user_unxid){
            return res.status(401).json({message: 'Error'})
        }


        if(!decoded_data || !decoded_data.isAdmin){
            return res.status(401).json({message: Error})
        }

        if(user_unxid === decoded_data.user_unx_id && decoded_data.isAdmin){
            next()
        }

        res.status(401).json({message: 'Failed Admin Checks!'})





    } catch (error) {
        console.log('Middleware error: ', error); // TODO: Handle this error
        res.status(500).json({ message: 'Internal server error.' });
    }
}

module.exports = checkAdminMiddleware