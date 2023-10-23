const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { mongo } = require('../db/config');

const db = mongo.db(process.env.MONGO_DB_NAME)

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

const  createVerificationCode = async (unxid) => {
    try {
        const verificationCode = crypto.randomBytes(32).toString('hex')

        await db.collection('email-auth-token').updateOne(
            { user_unxid: unxid },
            { $set: { verificationCode: verificationCode, isVerified: false } },
            { upsert: true } 
        );
        

        return verificationCode;
    } catch (error) {
        console.log('Error generating verification code:', error); // TODO: Add error handling
        return null;
    }
}

const verifyEmailCode = async (unxid, emailCode) => {
    try {
        const emailCodeDoc = await db.collection('email-auth-token').findOne({ user_unxid: unxid });

        if (!emailCodeDoc) {
            return false;
        }

        const isValid = emailCodeDoc.verificationCode === emailCode;

        if (isValid) {
            await db.collection('email-auth-token').updateOne(
                { user_unxid: unxid },
                { $set: { isVerified: true } }
            );

            await db.collection('users').updateOne(
                { unxid: unxid },
                { $set: { email_verified: true } }
            )
        }

        return isValid;
    } catch (error) {
        console.log('Error verifying email code:', error); // TODO: Add error handling
        return false;
    }

}


const updateUserPassword = async (user_unxid, new_password) => {
    try {
        await db.collection('users').updateOne(
            { unxid: user_unxid },
            { $set: { password: new_password } }
        );

        return true;
    } catch (error) {
        console.log('Error updating user password: ', error) //TODO: Handle this error
        return false;
    }
}


module.exports = {
    hashUserPassword,
    comparePassHash,
    generateJWT,
    verifyJWT,
    createVerificationCode,
    verifyEmailCode,
    updateUserPassword

}