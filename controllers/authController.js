const User = require('../models/User')
const Auth = require('../models/Auth')

exports.login = async (req, res) => {
    try {
        const data = req.body


        const userData = await User.getUserByUserName(data.user_name)

        let userProfileDetails;
        let userContactDetails;

        // Getting Client specific data.
        if(userData.account_type = 'client'){
            console.log('Getting Client Details...')
            userProfileDetails = await User.getProfileDetailsClient(userData.unxid)
            console.log('Getting Client Contact Details...')
            userContactDetails = await User.getContactDetailsClient(userData.unxid)
        }
            
        if(!userData){
            res.status(400).json({message: 'User not found'})
            return
        }

        const passwordVerified = await Auth.comparePassHash(data.password, userData.password)

        if(!passwordVerified){
            res.status(400).json({message: 'Incorrect Password'})
            return
        }

        const {jwtToken, jwtExpire} = await Auth.generateJWT(userData)

        await User.updateUserDataUXID('session_token', jwtToken, userData.unxid)

        await User.updateUserDataUXID('online_status', 'online', userData.unxid)

        res.status(200).json({userData, jwtToken, userProfileDetails, userContactDetails})

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

