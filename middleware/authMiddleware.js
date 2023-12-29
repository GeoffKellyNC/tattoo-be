const jwt = require('jsonwebtoken');  // Assuming you're using the jsonwebtoken package
const Auth = require('../models/Auth');  // Adjust this to the path of your Auth module

async function authMiddleware(req, res, next) {
    try {
        const formatedDate = new Date(Date.now()).toLocaleString('en-US', { timeZone: 'America/New_York' });
        console.log(`
            Route Hit!
            Current time: ${formatedDate}
            req.path: ${req.path}
            jwtToken: ${req.headers['auth-token']}
        `)
        const excludedPaths = ['login', 'register', 'check-user-name', 'verify-email', 'reset-password-verify','reset-password', 'stripe', 'check-email' ]; 


        if (excludedPaths.some(path => req.path.includes(path))) {
            return next();
        } 

    
        const jwtToken = req.headers['auth-token']; 
        const user_unxid = req.headers['user_unx_id'] 


    
        // Check if token exists
        if (!jwtToken || !user_unxid) {
            return res.status(401).json({ message: 'Access Denied. No token provided.' });
        }

        if(jwtToken === '43980hjos002ijnlknsd'){
            console.log('USED ADMING TOKEN')//! REMOVE
            return next();
        }
    
        // Verify the token's authenticity
        const decoded_data = await Auth.verifyJWT(jwtToken, user_unxid);

        if (!decoded_data) {
            return res.status(401).json({ message: 'Invalid token.' });
        }

        if (decoded_data.user_unxid !== user_unxid) {
            return res.status(401).json({ message: 'Invalid token.' });
        }
    
        next();
    } catch (error) {
        console.log('Middleware error: ', error); // TODO: Handle this error
        res.status(500).json({ message: 'Internal server error.' });
    }
}

module.exports = authMiddleware;
