const User = require('../models/User')
const Auth = require('../models/Auth')

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

