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
        this.user_email = data.user_email
        this.password = data.password,
        this.googleId = data.googleId,
        this.created_date = new Date()
        this.account_type = data.account_type
        this.isAdmin = false
        this.isMod = false
        this.isArtist = false
        this.isCustomer = true
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
            }
            const result = await db.collection('users').insertOne(newUser)
            return result
        } catch (err) {
            console.log(err)
        }
    }

    static checkIfUserNameExists = async (user_name) => {
        try {
            console.log('Checking if username exists') //!REMOVE
            const userExists = await db.collection('users').findOne({ user_name: user_name })

            if (userExists) {
                return true
            } else {
                return false
            }
        } catch (error) {
            console.log(error)
        }
    }


}

module.exports = User;