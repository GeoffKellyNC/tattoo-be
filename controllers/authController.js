const User = require('../models/User')
const Auth = require('../models/Auth')
const sendResetPassEmail = require('../util/resetPasswordMailer')
const sanitizeUserData = require('../util/sanitizeUserData')


exports.login = async (req, res) => {
    try {
        const data = req.body

        const email = data.email.toLowerCase()

        const userData = await User.getUserByEmail(email)

        const storedPassword = await User.getUserPassword(userData.unxid)
            
        if(!userData || !storedPassword){
            res.status(400).json({message: 'User not found'})
            return
        }

        const passwordVerified = await Auth.comparePassHash(data.password, storedPassword)

        if(!passwordVerified){
            res.status(400).json({message: 'Incorrect Password'})
            return
        }

        let userProfileDetails;
        let userContactDetails;
        let clientUploadedImages;

        // Artist specific data.
        let artistDetials;
        

        // Getting Client specific data.
        if(userData.account_type === 'client'){
            userProfileDetails = await User.getProfileDetailsClient(userData.unxid)
            userContactDetails = await User.getContactDetailsClient(userData.unxid)
            clientUploadedImages = await User.getClientUploadedImages(userData.unxid)
        }

        if(userData.account_type === 'artist'){
            userProfileDetails = await User.getProfileDetailsClient(userData.unxid)
            userContactDetails = await User.getContactDetailsClient(userData.unxid)
            clientUploadedImages = await User.getClientUploadedImages(userData.unxid)
            artistDetials = await User.getArtistDetails(userData.unxid)
        }
        


        const jwtToken  = await Auth.generateJWT(userData)

        const decoded_data = await Auth.verifyJWT(jwtToken)

        await User.updateUserDataUXID('session_token', jwtToken, userData.unxid)

        await User.updateUserDataUXID('online_status', 'online', userData.unxid)

        const sanitizedData = await sanitizeUserData(userData)

        console.log('LOGIN SANITIZED DATA: ', sanitizedData) //!REMOVE

        res.status(200).json({userData: sanitizedData, jwtToken, userProfileDetails, userContactDetails, clientUploadedImages, decoded_data, artistDetials: artistDetials ? artistDetials : null})

        return


    } catch (error) {
        console.log('Error logging in: ', error) //TODO: Handle this error
        res.status(500).json({message: 'Error logging in', error})
        return
    }
};

exports.logout = async (req, res) => {
    try {
        const unxid = req.headers['user_unx_id']


        await User.updateUserDataUXID('session_token', '', unxid)
        await User.updateUserDataUXID('online_status', 'offline', unxid)

        res.clearCookie('auth-token')

        res.status(200).json({message: 'User logged out'})

    } catch (error) {
        console.log('Error logging out: ', error) //TODO: Handle this error
        res.status(500).json({message: 'Error logging out', error})
    }
}

exports.verifyUserAccess = async (req, res) => {
    try {
        const jwt = req.headers['auth-token']
        
        // check to make sure token has not expired, make sure the token is valid

        const decoded_data = await Auth.verifyJWT(jwt)

        if(!decoded_data){
            res.status(400).json({message: 'Invalid token'})
            return
        }

        res.status(200).json({message: 'Valid token', data: decoded_data})
        
    } catch (error) {
        console.log('Error verifying user access: ', error) //TODO: Handle this error
        res.status(500).json({message: 'Error verifying user access', error})
    }
}


exports.verifyEmailController = async (req, res) => {
    try{
        const { token, unxid } = req.query;


        if (!token || !unxid) {
            res.status(400).send('Missing required parameters.');
            return;
        }


        const isValid = await Auth.verifyEmailCode(unxid, token);

        if (!isValid) {
            res.status(400).send('Invalid or expired token.');
            return;
        }

        res.status(200).send('<h1> Email Verified Successfully Please login. </h1>');

    } catch (error) {
        console.log('Error verifying email: ', error) //TODO: Handle this error
        res.status(500).json({message: 'Error verifying email', error})
    }
}

exports.updateUserPassword = async (req, res) => {
    try {
        const unxid = req.headers["user_unx_id"]
        const newPassword = req.body.newPassword
        const currentPassword = req.body.currentPassword
        
        const userData = await User.getUserByUNXID(unxid)

        if(!userData){
            res.status(400).json({message: 'User not found'})
            return
        }

        const currentValid = await Auth.comparePassHash(currentPassword, userData.password)

        if(!currentValid){
            res.status(400).json({message: 'Incorrect Password'})
            return
        }

        const newHashedPass = await Auth.hashUserPassword(newPassword)

        const updated = await Auth.updateUserPassword(unxid, newHashedPass)

        if(!updated){
            res.status(400).json({message: 'Error updating password'})
            return
        }

        res.status(200).json({message: 'Password updated successfully'})


    } catch (error) {
        console.log('Error Updating User Password: ', error)//TODO: Handle this error (LOG)
        res.status(500).json({message: 'Error updating Password', data: error})
    }
}

exports.sendResetPasswordEmail = async (req, res) => {
    try {
        const user_email = req.body.user_email.trim()

        if(!user_email){
            res.status(401).json({message: 'Error Not Valid'})
            return
        }

        const unxid = await User.getUserIdByEmail(user_email)


        if(!unxid){
            res.status(401).json({message: "Error resetting password. Code: x459"})
            return
        }
        
        const token = await Auth.createResetToken(unxid)

        const emailSent = await sendResetPassEmail(unxid, user_email, token)

        if(!emailSent) {
            res.status(500).json({message: 'Server Error. Email not sent'})
            return
        }

        res.status(200).json({message: "If your email is found please an email will be sent to your inbox. Please check spam folder if you do not see an email from LINK'D"})

    } catch (error) {
        console.log("Error sending Password reset email") //TODO: Handle this error (LOG)
        res.status(500).json({message: "Server Error updating password"})
        return
    }
}

exports.resetUserPassword = async (req, res) => {
    try {
        const newPassword = req.body.newPassword
        const unxid = req.body.unxid
        const token = req.body.token
        

        if(!newPassword || !token || !unxid){
            res.status(401).json({message: "Error resetting Password 0x84949"})
            return
        }

        const tokenValid = await Auth.verifyResetToken(unxid, token)

        if(!tokenValid){
            res.status(401).json({message: "Token is no longer valid. Please request a new password reset."})
            return
        }

        const encryptedPassword = await Auth.hashUserPassword(newPassword)

        await Auth.updateUserPassword(unxid, encryptedPassword)

        res.status(200).json({message: "Password updated successfully. Please login with your new password."})

    } catch (error) {
        console.log("Error resetting password: ", error) 
        res.status(500).json({message: "Error resetting password"})
    }
}

exports.decodeJWTPayload = async (req, res) => {
    try {
        const jwtToken = req.headers['auth-token']

        const decoded_data = await Auth.verifyJWT(jwtToken)

        res.status(200).json({message: 'Decoded Data', data: decoded_data})

    } catch (error) {
        console.log("Error decoding JWT: ", error) 
        res.status(500).json({message: "Error decoding JWT"})
    }
}


exports.checkIfEmailExists = async (req, res) => {
    try {
        const email = req.body.email.toLowerCase()

        console.log('Checking Email Exists: ', email) //!REMOVE

        const user = await User.checkIfEmailExists(email)

        console.log('Checking Email Exists RETURN: ', user) //!REMOVE

        if(!user){
            res.status(200).json({message: 'Email does not exist', data: false})
            return
        }

        res.status(200).json({message: 'Email already exists', data: true})

    } catch (error) {
        console.log("Error checking if email exists: ", error) 
        res.status(500).json({message: "Error checking if email exists"})
    }
}


