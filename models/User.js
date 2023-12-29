require("dotenv").config();
const { mongo } = require('../db/config')
const { v4: uuid} = require('uuid');
const { hashUserPassword }= require("./Auth")
const Auth = require('./Auth')
const sendVerificationEmail = require('../util/emailVerifyMailer');
const socketService = require('../services/socketService');
const axios = require('axios');
const convertUserLocationData = require('../google/UserLocation')


const db = mongo.db(process.env.MONGO_DB_NAME)



class User {
    constructor(data) {
        this.unxid = uuid()
        this.first_name = data.first_name
        this.last_name = data.last_name
        this.user_name = data.user_name.toLowerCase()
        this.display_name = data.display_name
        this.user_email = data.email.toLowerCase()
        this.user_email_verified = false
        this.password = data.password,
        this.googleId = data.googleId,
        this.created_date = new Date()
        this.account_type = data.account_type
        this.isAdmin = false
        this.isMod = false
        this.isArtist = data.account_type.toLowerCase() === 'artist' ? true : false
        this.isClient = data.account_type.toLowerCase() === 'client' ? true : false
        this.session_token = null
        this.account_status = 'active',
        this.online_status = 'offline'
        this.subscription_active = false
        this.subscription_type = null
        this.subscription_start_date = null
        this.subscription_end_date = null
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
            console.log(error) // TODO: Add error handling
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
                email_verified: this.user_email_verified,
                password: user_pass_hash,
                googleId: this.googleId,
                created_date: this.created_date,
                account_type: this.account_type,
                isAdmin: this.isAdmin,
                isMod: this.isMod,
                isArtist: this.isArtist,
                isClient: this.isClient,
                session_token: this.session_token,
                account_status: this.account_status,
                online_status: this.online_status,
                subscription_active: this.subscription_active,
                subscription_type: this.subscription_type,
                subscription_start_date: this.subscription_start_date,
                subscription_end_date: this.subscription_end_date,
                attr1: null, // Stripe Client ID
                attr2: null, // Stripe Session ID
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

    static checkIfEmailExists = async (email) => {
        try {
            const userExists = await db.collection('users').findOne({ user_email: email })

            if (userExists) {
                return true
            } else {
                return false
            }
        } catch (error) {
            console.log(error) //TODO: Handle this error
        }
    }

    static getUserPassword = async (unxid) => {
        try {
            const user = await db.collection('users').findOne({ unxid: unxid })


            return user.password
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    // Get user data. Core data artists and clients
    static getUserByUserName = async (user_name) => {
        try {
            const user = await db.collection('users').findOne({ user_name: user_name })

            if(!user){
                return false
            }

            return user
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    static async getUserByEmail(email) {
        try {
            const user = await db.collection('users').findOne({ user_email: email })

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
    static getUserByUNXID = async (unxid) => {
        try {
            const user = await db.collection('users').findOne({ unxid: unxid })


            return user
        } catch (error) {
            console.log(error) //TODO: Handle this error
        }
    }

    static getUserIdByEmail = async (user_email) => {
        try {
            const user = await db.collection('users').findOne({ user_email: user_email })


            return user.unxid
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
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
            
            const result = await db.collection('client-profile-image').findOneAndUpdate(
                { 
                    user_unxid: user_unxid, 
                    is_active: true
                }, 
                { 
                    $set: { is_active: false } 
                }
            );
            
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
            
            return imageObj;
        
        } catch (error) {
            console.log('Error encountered in saveOrUpdateProfileImage:', error); //TODO: Handle Error (LOG)
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
            console.log('Error SettingDetails Client: ', error); //TODO Handle this error (Log)
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
            console.log('Error Getting Client Uploaded Images: ', error); //TODO: Handle this error (LOG)
            return false;
        }
    }

    static async fetchPaginatedUsers(page = 1, limit = 10, cordsObj) {
        const skipAmount = (page - 1) * limit;
        const { lat, lng } = cordsObj;
        let currentCity = null;
    
        try {
            const res = await convertUserLocationData(lat, lng);

            if(!res){
                return []
            }

            currentCity = res.city;

        } catch (error) {
            console.log('Error fetching city from cords: ', error); //TODO: Handle this error
        }
    
        if (currentCity) {
            try {
                const users = await db.collection('users').aggregate([
                    {
                        $lookup: {
                            from: "client-user-details",
                            localField: "unxid",
                            foreignField: "user_unxid",
                            as: "userDetails"
                        }
                    },
                    {
                        $lookup: {
                            from: "client-contact-info",
                            localField: "unxid",
                            foreignField: "user_unxid",
                            as: "contactInfo"
                        }
                    },
                    {
                        $lookup: {
                            from: "client-profile-image",
                            let: { user_unxid: "$unxid" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$user_unxid", "$$user_unxid"] },
                                                { $eq: ["$is_active", true] }
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: "profileImage"
                        }
                    },
                    { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: "$contactInfo", preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: "$profileImage", preserveNullAndEmptyArrays: true } },
                    {
                        $match: {
                            "userDetails.location_city": currentCity
                        }
                    },
                    { $skip: skipAmount },
                    { $limit: limit },
                    {
                        $project: {
                            password: 0,
                            user_email: 0,
                            session_token: 0,
                            account_status: 0,
                            isMod: 0,
                            isAdmin: 0,
                            attr1: 0,
                            attr2: 0,
                            attr3: 0,
                            attr4: 0,
                            attr5: 0,
                            attr6: 0,
                            attr7: 0,
                            attr8: 0,
                            user_unxid: 0,
                            subscription_active: 0,
                            subscription_type: 0,
                            subscription_start_date: 0,
                            subscription_end_date: 0
                        }
                    }
                ]).toArray();
    
                users.forEach(user => {
                    if (user.userDetails) {
                        Object.assign(user, user.userDetails);
                        delete user.userDetails;
                    }
    
                    if (user.contactInfo) {
                        Object.assign(user, user.contactInfo);
                        delete user.contactInfo;
                    }
    
                    if (user.profileImage) {
                        user.profileImageUrl = user.profileImage.image_url;
                        delete user.profileImage;
                    }
                });
    
                return users;
            } catch (err) {
                console.error("Error fetching paginated users:", err);
                return null;
            }
        } else {
            console.log("No city found for the provided coordinates");
            return [];
        }
    }
    

    static async fetchUserProfileByUnxid(unxid) {
        try {
            const users = await db.collection('users').aggregate([
                {
                    $match: {
                        unxid: unxid
                    }
                },
                {
                    $lookup: {
                        from: "client-user-details",
                        localField: "unxid",
                        foreignField: "user_unxid",
                        as: "userDetails"
                    }
                },
                {
                    $lookup: {
                        from: "client-contact-info",
                        localField: "unxid",
                        foreignField: "user_unxid",
                        as: "contactInfo"
                    }
                },
                {
                    $lookup: {
                        from: "client-profile-image",
                        let: { user_unxid: "$unxid" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$user_unxid", "$$user_unxid"] },
                                            { $eq: ["$is_active", true] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "profileImage"
                    }
                },
                { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                { $unwind: { path: "$contactInfo", preserveNullAndEmptyArrays: true } },
                { $unwind: { path: "$profileImage", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        password: 0,
                        user_email: 0,
                        session_token: 0,
                        account_status: 0,
                        isMod: 0,
                        isAdmin: 0,
                        attr1: 0,
                        attr2: 0,
                        attr3: 0,
                        attr4: 0,
                        attr5: 0,
                        attr6: 0,
                        attr7: 0,
                        attr8: 0,
                        user_unxid: 0,
                        
                    }
                }
            ]).toArray();
    
            const user = users[0];  // Since we expect a single user
    
            if (user.userDetails) {
                Object.assign(user, user.userDetails);
                delete user.userDetails;
            }
    
            if (user.contactInfo) {
                Object.assign(user, user.contactInfo);
                delete user.contactInfo;
            }
    
            if (user.profileImage) {
                user.profileImageUrl = user.profileImage.image_url;
                delete user.profileImage;
            }
    
            return user;
        } catch (err) {
            console.error("Error fetching user by unxid:", err); //TODO: Handle this error (LOG)
            return null;
        }
    }

    static async setUpArtistDefaults(unxid) {
        try {
            let defaultObject = {
                user_unxid: unxid,
                years_experience: null,
                specializations: [],
                portfolio: null,
                is_licenced: false,
                is_verified: false,
                studio_affiliation: false,
                studio_name: null,
                studio_url: null,
                is_pay_hourly: false,
                is_pay_fixed: false,
                pay_hourly_rate: null,
                pay_fixed_min: null,
                pay_fixed_max: null,
                deposit_required: false,
                artist_rating_count: null,
                artist_rating_total: null,
                artist_rating_average: null,
                artist_reviews: [],
                artist_reviews_count: null,
                artist_reviews_total: null, 
                uses_booking_system: false,
                booking_system_url: null,
                cerifications: [],
                awards: [],
                payment_methods: [],
                artist_mediums: [],
                artist_equipment: [],
                attr1: null,
                attr2: null,
                attr3: null,
                attr4: null,
                attr5: null,
                attr6: null

            }

            await db.collection('user-artists-data').insertOne(defaultObject)

            return defaultObject
            
        } catch (error) {
            console.log('Error Setting Up Artist Defaults: ', error) //TODO: Handle this error (LOG)
        }
    }

    static async getArtistDetails(unxid) {
        try {
            const res = await db.collection('user-artists-data').findOne({ user_unxid: unxid })

            return res
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    static async updateUserEmail(unxid, email) {
        try {
            await db.collection('users').updateOne({ unxid: unxid }, { $set: { user_email: email } })
            return email
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    static async setStripeCustomerID(unxid, customer_id) {
        try {
            await db.collection('users').updateOne({ unxid: unxid }, { $set: { attr1: customer_id } })
            return true
        }
        catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    static async setStripeSessionId(unxid, session_id) {
        try {
            await db.collection('users').updateOne({ unxid: unxid }, { $set: { attr2: session_id } })
            return true
        }
        catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    static async getStripeSessionId(unxid) {
        try {
            const user = await db.collection('users').findOne({ unxid: unxid })
            return user.attr2
        }
        catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    static async updateUserSubscription(customer_id, subscription_type, status) {
        try {
            await db.collection('users').updateOne({attr1 : customer_id }, { $set: { subscription_type: subscription_type, subscription_active: status } })
            return true
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    static updateUserData = async (property, data, unxid) => {
        switch(property){
            case 'email':
                try {
                    console.log('Updating Email', unxid) //!REMOVE
                    await db.collection('users').updateOne({ unxid: unxid }, { $set: { user_email: data.user_email, email_verified: false } })
                    console.log('Sending Email') //!REMOVE

                    const verificationCode = await Auth.createVerificationCode(unxid);

                    await sendVerificationEmail(unxid, data.user_email, verificationCode);

                    socketService.emitToUser(unxid, "data_notification", { active: true, message: `You have updated your email to ${data.user_email}. Please verify your new email!` })

                    console.log('Email Sent ') //!REMOVE

                    setTimeout(() => {
                        console.log('Sending Logout') //!REMOVE
                        socketService.emitToUser(unxid, "log_out")
                    }, 5000) // 5 seconds;

                    return true

                } catch (error) {
                    console.log(error) //TODO: Handle this error
                    return false
                }
            case 'display_name':
                try {
                    console.log('Updating Display Name') //!REMOVE
                    await db.collection('users').updateOne({ unxid: unxid }, { $set: { display_name: data.display_name } })

                    return true

                } catch (error) {
                    console.log(error) //TODO: Handle this error
                    return false
                }
            case 'all':
                try {

                    console.log('Updating All', unxid) //!REMOVE
                    await db.collection('users').updateOne({ unxid: unxid }, { $set: { user_email: data.user_email, display_name: data.display_name, email_verified: false } })

                    const verificationCode = await Auth.createVerificationCode(unxid);

                    console.log('Sending Email') //!REMOVE

                    await sendVerificationEmail(unxid, data.user_email, verificationCode);

                    socketService.emitToUser(unxid, "data_notification", { active: true, message: `You have updated your email to ${data.user_email}. Please verify your new email!` })

                    setTimeout(() => {
                        console.log('Sending Logout') //!REMOVE
                        socketService.emitToUser(unxid, "log_out")
                    }, 5000) // 5 seconds;

                    return true

                } catch (error) {

                    console.log(error) //TODO: Handle this error

                    return false
                }
                
            default:
                console.log('Error: Invalid Property')
                return false
        }
    }

    static async updateArtistDetails(unxid, data) {
        try {
            await db.collection('user-artists-data').updateOne({ user_unxid: unxid }, { $set: {
                years_experience: data.years_experience,
                studio_affiliation: data.studio_affiliation,
                studio_url: data.studio_url,
                is_licenced: data.is_licenced,
                portfolio: data.portfolio_url,
                uses_booking_system: data.uses_booking_system,
                studio_name: data.studio_name,
            } })

            return true
        } catch (error) {
            console.log('Error Updating Artist Details: ', error) //TODO: Handle this error (LOG)
            return false
        }
    }

    static async updateContactDetails(unxid, data){
        try {
            await db.collection('client-contact-info').updateOne({
                user_unxid: unxid
            }, {
                $set: {
                    contact_phone: {
                        public: data.contact_phone.public,
                        value: data.contact_phone.value
                    },
                    contact_instagram: {
                        public: data.contact_instagram.public,
                        value: data.contact_instagram.value
                    },
                    contact_snapchat: {
                        public: data.contact_snapchat.public,
                        value: data.contact_snapchat.value
                    },
                    contact_x: {
                        public: data.contact_x.public,
                        value: data.contact_x.value
                    },
                    contact_discord: {
                        public: data.contact_discord.public,
                        value: data.contact_discord.value
                    },
                }
            })

            return true
        } catch (error) {
            console.log('Error Updating Contact Details: ', error) //TODO: Handle this error (LOG)
            return false
        }
    }

    getCustomerEmailByCustomerId = async (customer_id) => {
        try {
            const user = await db.collection('users').findOne({ attr1: customer_id })

            return {email: user.user_email, userName: user.user_name}
        } catch (error) {
            console.log(error) //TODO: Handle this error
            return false
        }
    }

    static async updatePhotosLikes(image_id, action) {
        try {
            if(action === 'add'){
                await db.collection('client-uploaded-images').updateOne({ image_id: image_id }, { $inc: { num_likes: 1 } })
            }else if(action === 'remove'){
                await db.collection('client-uploaded-images').updateOne({ image_id: image_id }, { $inc: { num_likes: -1 } })
            }else{
                return false
            }

            return true
        } catch (error) {
            console.log('Error Updating Photo Likes: ', error) //TODO: Handle this error (LOG)
            return false
        }
    }


}
    


module.exports = User;