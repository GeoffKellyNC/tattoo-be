const User = require('../models/User')


// Return True if username is taken and false if it is available
exports.checkUserNameExists = async (req, res) => {
    try {
        const username = req.params.user_name

        const doesUserExists = await User.checkIfUserNameExists(username)

        console.log('doesUserExists: ', doesUserExists) //!REMOVE

        if(!doesUserExists) {
            res.status(200).json({message: false})
            return
        }

        res.status(200).json({message: true})
        
    } catch (error) {
        console.log('Error checking if username is taken: ', error) //TODO: Handle this error
    }
}

exports.createUser = async (req, res) => {
    try {
        const user = new User(req.body)

        const userChecks = await user.create_user_checks()

        if(userChecks){
            res.status(400).json(userChecks)
            return
        }

        user.create_user_in_db()
        res.status(200).json({message: 'User created successfully'})




    } catch (error) {
        console.log('Error creating user: ', error) //TODO: Handle this error
    }
}