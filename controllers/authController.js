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

        const {jwtToken, jwtExpire} = await Auth.generateJWT(userData)

        await User.updateUserDataUXID('session_token', jwtToken, userData.unxid)

        await User.updateUserDataUXID('online_status', 'online', userData.unxid)

        res.status(200).json({userData, jwtToken})

        return


    } catch (error) {
        console.log('Error logging in: ', error) //TODO: Handle this error
        res.status(500).json({message: 'Error logging in', error})
        return
    }
};

exports.logout = async (req, res) => {
    try {
        const user = req.user


        await User.updateUserDataUXID('session_token', '', user.unxid)
        await User.updateUserDataUXID('online_status', 'offline', user.unxid)

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

        console.log('user: ', user) //!REMOVE

        res.status(200).json(user)

    } catch (error) {
        console.log('Error verifying user access: ', error) //TODO: Handle this error
        res.status(500).json({message: 'Error verifying user access', error})
    }
}

exports.loginGoogle = function(req, res) {};


exports.getLinkGoogle = function(req, res) {};