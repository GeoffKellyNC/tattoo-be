require("dotenv").config();
const { mongo } = require('../db/config')
const { v4: uuid} = require('uuid');
const { hashUserPassword }= require("./Auth")


const db = mongo.db(process.env.MONGO_DB_NAME)



class User {
    constructor(data) {
        this.unxid = uuid()
        this.first_name = data.first_name
        this.last_name = data.last_name
        this.user_name = data.user_name
        this.display_name = data.display_name
        this.user_email = data.email
        this.password = data.password,
        this.googleId = data.googleId,
        this.created_date = new Date()
        this.account_type = data.account_type
        this.isAdmin = false
        this.isMod = false
        this.isArtist = false
        this.isCustomer = true
        this.session_token = null
        this.account_status = 'active',
        this.online_status = 'offline'
    }

    async create_user_checks() {
        try {

            const userExists = await db.collection('users').findOne({ $or: [{ user_email: this.user_email }, { user_name: this.user_name }] })

            if (userExists) {
                if (userExists.user_email === this.user_email) {
                    return { message: 'Email already in use', field: 'user_email' }
                } else if (userExists.user_name === this.user_name) {
                    return { message: 'Username already in use', field: 'user_name' }
                }else {
                    return false
                }
            }

        } catch (error) {
            console.log(error) //! TODO: Add error handling
        }
    }


    async create_user_in_db() {
        try {
            const user_pass_hash = await hashUserPassword(this.password)

            const newUser = {
                unxid: this.unxid,
                first_name: this.first_name,
                last_name: this.last_name,
                user_name: this.user_name,
                display_name: this.display_name,
                user_email: this.user_email,
                password: user_pass_hash,
                googleId: this.googleId,
                created_date: this.created_date,
                account_type: this.account_type,
                isAdmin: this.isAdmin,
                isMod: this.isMod,
                isArtist: this.isArtist,
                isClient: this.isCustomer,
                session_token: this.session_token,
                account_status: this.account_status,
                online_status: this.online_status,
                attr1: null,
                attr2: null,
                attr3: null,
                attr4: null,
                attr5: null,
                attr6: null,
                attr7: null,
                attr8: null,
            }
            const result = await db.collection('users').insertOne(newUser)
            return result
        } catch (err) {
            console.log(err) //TODO: Handle this error
        }
    }

    static checkIfUserNameExists = async (user_name) => {
        try {
            const userExists = await db.collection('users').findOne({ user_name: user_name })

            if (userExists) {
                return true
            } else {
                return false
            }
        } catch (error) {
            console.log(error) //TODO: Handle this error
        }
    }

    static getUserByUserName = (user_name) => {
        try {
            const user = db.collection('users').findOne({ user_name: user_name })

            if(!user){
                return false
            }

            return user
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    static getUserByUNXID = (unxid) => {
        try {
            const user = db.collection('users').findOne({ unxid: unxid })

            return user
        } catch (error) {
            console.log(error) //TODO: Handle this error
        }
    }

    static updateUserDataUXID = async (property, value, unxid) => {
        try {

            await db.collection('users').updateOne({ unxid: unxid }, { $set: { [property]: value } })

            return true
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    static saveProfileImage = async (user_unxid, image_url, user_name) => {
        try {
            const imageObj = {
                user_unxid: user_unxid,
                user_name: user_name,
                image_id: uuid(),
                image_url: image_url,
                image_upload_date: new Date(),
                is_active: true,
                is_deleted: false,
                deleted_date: null,
                deleted_by: null,
            }

            await db.collection('client-profile-image').insertOne(imageObj)

            return imageObj
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

}

module.exports = User;