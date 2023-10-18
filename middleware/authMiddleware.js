const jwt = require('jsonwebtoken');  // Assuming you're using the jsonwebtoken package
const Auth = require('../models/Auth');  // Adjust this to the path of your Auth module

async function authMiddleware(req, res, next) {
    try {

        console.log('req.path: ', req.path) //!REMOVE
        const excludedPaths = ['login', 'register', 'check-user-name']; 


        if (excludedPaths.some(path => req.path.includes(path))) {
            return next();
        }

    
        const jwtToken = req.headers['auth-token'];
        const user_unxid = req.headers.user_unx_id;

        console.log('jwtToken: ', jwtToken) //!REMOVE
        console.log('user_unxid: ', user_unxid) //!REMOVE

    
        // Check if token exists
        if (!jwtToken) {
            return res.status(401).json({ message: 'Access Denied. No token provided.' });
        }
    
        // Verify the token's authenticity
        const isValid = await Auth.verifyJWT(jwtToken, user_unxid);
        if (!isValid) {
            console.log('Invalid token') //!REMOVE
            return res.status(401).json({ message: 'Invalid token.' });
        }
    
        // Decode the JWT to inspect the expiration claim
        const decodedPayload = jwt.decode(jwtToken);
    
        // Check if token has expired
        const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds since the epoch
        if (decodedPayload.exp && decodedPayload.exp < currentTimestamp) {
            return res.status(401).json({ message: 'Token has expired. Please log in again.' });
        }
    
        req.user = decodedPayload;
    
        next();
    } catch (error) {
        console.log('Middleware error: ', error); // TODO: Handle this error
        res.status(500).json({ message: 'Internal server error.' });
    }
}

module.exports = authMiddleware;
