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
    //Registration Checks
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

    // Regiser User and create in DB
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
            await db.collection('users').insertOne(newUser)
            return newUser
        } catch (err) {
            console.log(err) //TODO: Handle this error
        }
    }

    // Login Checks
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

    // Get user data. Core data artists and clients
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


    // Get core user data using unxid
    static getUserByUNXID = (unxid) => {
        try {
            const user = db.collection('users').findOne({ unxid: unxid })

            return user
        } catch (error) {
            console.log(error) //TODO: Handle this error
        }
    }

    // Make updates to user core data using unxid
    static updateUserDataUXID = async (property, value, unxid) => {
        try {

            await db.collection('users').updateOne({ unxid: unxid }, { $set: { [property]: value } })

            return true
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    static async saveOrUpdateProfileImage(user_unxid, image_url, user_name) {
        try {
            console.log('Starting saveOrUpdateProfileImage function...'); //!REMOVE
            
            // Step 1: Try to find and set existing active image to inactive
            console.log(`Trying to find and set active image to inactive for user_unxid: ${user_unxid}`); //!REMOVE
            const result = await db.collection('client-profile-image').findOneAndUpdate(
                { 
                    user_unxid: user_unxid, 
                    is_active: true
                }, 
                { 
                    $set: { is_active: false } 
                }
            );
            
            if (result && result.ok === 1 && result.value) {
                console.log('Existing active image found and set to inactive.'); //!REMOVE
            } else {
                console.log('No active image found for the user, or failed to set it to inactive.'); //!REMOVE
            }
            
            // Step 2: Insert the new image object as active
            console.log('Inserting new image object as active...'); //!REMOVE
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
            
            const insertResult = await db.collection('client-profile-image').insertOne(imageObj);
            
            if (insertResult && insertResult.insertedCount === 1) {
                console.log('Successfully inserted the new image object.'); //!REMOVE
            } else {
                console.log('Failed to insert the new image object.'); //!REMOVE
            }
            
            return imageObj;
        
        } catch (error) {
            console.log('Error encountered in saveOrUpdateProfileImage:', error); //!REMOVE
            return false;
        }
    }
    

    static async getActiveProfileImage(user_unxid) {
        try {
            const activeImage = await db.collection('client-profile-image').findOne({
                user_unxid: user_unxid,
                is_active: true
            });
    
            if (activeImage) {
                return activeImage;
            } else {
                console.log('No active profile image found for user:', user_unxid);
                return null;
            }
    
        } catch (error) {
            console.log('Error fetching active profile image:', error);
            return null;
        }
    }

     async setUpDatabaseDefaultsClient(unxid) {
        try {
            const defaultClientProfileDetails = {
                user_unxid: unxid,
                location_city: null,
                location_state: null,
                location_zip: null,
                profile_tagline: null,
                profile_description: null,
                number_of_tattoos: null,
                tattoo_style_preferences: null,
                preferred_size_range: null,
                allergies_or_skin_conditions: null,
                personal_tattoo_story: null,
            }

            const defaultClientContactDetails = {
                user_unxid: unxid,
                contact_phone: {public: false, value: null},
                contact_instagram: {public: false, value: null},
                contact_snapchat: {public: false, value: null},
                contact_x: {public: false, value: null},
                contact_discord: {public: false, value: null},
                contact_website: {public: false, value: null},
                other_1: {public: false, value: null},
                other_2: {public: false, value: null},
            }
    
            await db.collection('client-user-details').insertOne(defaultClientProfileDetails)
            await db.collection('client-contact-info').insertOne(defaultClientContactDetails)
    
            return true
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }


    }

    static async setProfileDetailsClient(unxid, data) {
        try {
            const filter = { user_unxid: unxid };
            delete data._id
            const update = { $set: data }; 
            const options = { new: true, upsert: true };
    
            await db.collection('client-user-details').findOneAndUpdate(filter, update, options);
    
            return data;
        } catch (error) {
            console.log('Error SettingDetails Client: ', error);
            return false;
        }
    }
    

    static async getProfileDetailsClient(unxid) {
        try {
            const res = await db.collection('client-user-details').findOne({ user_unxid: unxid })

            return res
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    static async setContactDetailsClient(unxid, data) {
        try {
            const filter = { user_unxid: unxid }
            const options = {new: true, upsert: true}

            const res = await db.collection('client-contact-info').findOneAndUpdate(filter, data, options)

            return res
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    static async getContactDetailsClient(unxid) {
        try {
            const res = await db.collection('client-contact-info').findOne({ user_unxid: unxid })

            return res
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    static async saveClientUploadedImage (unxid, url, user_name) {
        try {
            const imageObj = {
                user_unxid: unxid,
                user_name: user_name,
                image_id: uuid(),
                image_url: url,
                image_upload_date: new Date(),
                num_likes: 0,
                num_comments: 0,
                comments: [],
                num_reports: 0,
                title: null,
                description: null,
                is_active: true,
                is_deleted: false,
                deleted_date: null,
                deleted_by: null,
            }

            await db.collection('client-uploaded-images').insertOne(imageObj)

            return imageObj
            
        } catch (error) {
            console.log('Error Saving Client Uploaded Image: ', error)
            return false
        }
    }

    static async getClientUploadedImages (unxid) {
        try {
            const query = {
                user_unxid: unxid,
                is_deleted: false,    
                is_active: true      
            };
    
            const res = await db.collection('client-uploaded-images').find(query).toArray();
            
            return res;
        } catch (error) {
            console.log('Error Getting Client Uploaded Images: ', error);
            return false;
        }
    }
    
}

module.exports = User;