const User = require('../models/User')
const Auth = require('../models/Auth')
const sendResetPassEmail = require('../util/resetPasswordMailer')

exports.login = async (req, res) => {
    try {
        const data = req.body


        const userData = await User.getUserByUserName(data.user_name)


            
        if(!userData){
            res.status(400).json({message: 'User not found'})
            return
        }

        const passwordVerified = await Auth.comparePassHash(data.password, userData.password)

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
            artistDetials = await User.setUpArtistDefaults(userData.unxid)
        }
        


        const {jwtToken, jwtExpire} = await Auth.generateJWT(userData)

        await User.updateUserDataUXID('session_token', jwtToken, userData.unxid)

        await User.updateUserDataUXID('online_status', 'online', userData.unxid)

        res.status(200).json({userData, jwtToken, userProfileDetails, userContactDetails, clientUploadedImages})

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

exports.verifyUserAccess = (req, res) => {
    try {
        const user = req.user

        res.status(200).json(user)

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
        const user_email = req.body

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
            res.status(500).json({message: 'Server Errorl. Email not sent'})
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
        const newPassword = req.body
        const { token, unxid} = req.query

        if(!newPassword || !token || !unxid){
            res.status(401).json({message: "Error resetting Password 0x84949"})
            return
        }

        const tokenValid = await Auth.verifyResetToken(unxid, token)

        if(!tokenValid){
            res.status(401).json({message: "Token is no longer valid. Please request a new password reset."})
            return
        }

        await Auth.updateUserPassword(unxid, newPassword)

        res.status(200).json({message: "Password updated successfully. Please login with your new password."})

    } catch (error) {
        console.log("Error resetting password: ", error) 
        res.status(500).json({message: "Error resetting password"})
    }
}


