const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

 const hashUserPassword = async (user_pass) => {
    try {
        const saltRounds = 10;

        const hashed_user_pass = bcrypt.hash(user_pass, saltRounds)

        return hashed_user_pass

    } catch (error) {
        console.log("Error hasing user password", error) //TODO : HANDLE ERROR
        return false
    }
}

 const comparePassHash = async (password, stored_hash) => {
    try {
        
        const isSame = await bcrypt.compare(password, stored_hash)

        return isSame ? true : false

    } catch (error) {
        console.log("Error comparing hash ", error) //TODO: Handle Error
        return false
    }
}

const generateJWT = async (user) => {
    const secret = process.env.JWT_SECRET

    const payload = {
        user_unxid: user.unxid
    }

    const options = {
        expiresIn: '1d'
    }

    const jwtToken = jwt.sign(payload, secret, options)

    const jwtExpire = jwt.decode(jwtToken).exp * 1000

    return { jwtToken, jwtExpire }



}

const verifyJWT = async (token, user_unxid) => {
    try {
        const secret = process.env.JWT_SECRET
    
        const decoded =  jwt.verify(token, secret)
    
    
        if (decoded.user_unxid != user_unxid) {
            console.log('JWT token does not match user unxid') //TODO: Handle this error (LOG)
            return false
        }
    
        return true;
    } catch (error) {
        console.log('Error verifying JWT: ', error) //TODO: Handle this error
    }
    
}


module.exports = {
    hashUserPassword,
    comparePassHash,
    generateJWT,
    verifyJWT
}