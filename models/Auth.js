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
        user_unxid: user.unxid,
        isAdmin: user.isAdmin,
        isMod: user.isMod,
        isClient: user.isClient,
        isArtist: user.isArtist,
        subscription_active: user.subscription_active,
        subscription_type: user.subscription_type,
    }

    const options = {
        expiresIn: '1d'
    }

    const jwtToken = jwt.sign(payload, secret, options)

    return jwtToken

}

const verifyJWT = async (token) => {
    try {
        const secret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        return decoded;
    } catch (error) {
        console.log('Error verifying JWT: ', error); //TODO: Handle this error
        return null;
    }
}

const verifyResetToken = async (unxid, resetCode) => {
    try {
            const resetTokenDoc = await db.collection('pass-reset-token').findOne({ user_unxid: unxid });

            if (!resetTokenDoc) {
                return false;
            }

            const isValid = resetTokenDoc.resetCode === resetCode;

            if(!isValid) {
                return false;
            }

            if(!resetTokenDoc.isValid) {
                return false;
            }

            const currentTimestamp = Math.floor(Date.now() / 1000); 
            const createdTimestamp = Math.floor(resetTokenDoc.created / 1000); 

            if (currentTimestamp - createdTimestamp > 7200) { // 2 hours
                return false;
            }

            await db.collection('pass-reset-token').updateOne(
                { user_unxid: unxid },
                { $set: { isValid: false } }
            );

            return true;
        }
    catch (error) {
        console.log('Error verifying reset token:', error); // TODO: Add error handling
        return false;
    }
}

const createResetToken = async (unxid) => {
    try {
        const resetCode = crypto.randomBytes(64).toString('hex')

        await db.collection('pass-reset-token').updateOne(
            {user_unxid: unxid},
            {$set: {resetCode: resetCode, isValid: true, created: Date.now()}},
            { upsert: true }
        )

        return resetCode

    } catch (error) {
        console.log('Error generating reset code:', error); // TODO: Add error handling
        return false;
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
    updateUserPassword,
    createResetToken,
    verifyResetToken

}