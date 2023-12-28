require("dotenv").config();
const { mongo } = require('../db/config')
const { v4: uuid} = require('uuid');
const { bucket } = require('../google/gcs-img-config')
const zipToCords = require('../google/zipToCords')


const db = mongo.db(process.env.MONGO_DB_NAME)



class Job {
    constructor(data, unxid){
        this.job_id = uuid();               
        this.owner_id = unxid;    
        this.owner_user_name = data.owner_user_name;        
        this.job_created_date = new Date();             
        this.job_title = data.job_title;                
        this.job_desc = data.job_desc;                  
        this.job_photos = [];        
        this.job_characteristics = data.job_characteristics || {}; 
        this.job_location = data.job_location;    
        this.job_zipcode = data.job_zipcode;       
        this.job_budget = data.job_budget || null;     
        this.artist_preference = data.artist_preference || []; 
        this.job_status = data.job_status || 'open';     
        this.selected_artist_id = data.selected_artist_id || null; 
        this.job_expiry_date = data.job_expiry_date || null; 
        this.job_reviews = data.job_reviews || [];
        this.is_active = true
        this.is_deleted = false
        this.date_deleted = null
    }

    // Getters

    getJobId(){
        return this.job_id
    }

    async save(){
        try{
            const finalJobObj = {
                job_id: this.job_id,
                owner_id: this.owner_id.toLowerCase(),
                owner_user_name: this.owner_user_name,
                job_created_date: this.job_created_date,
                job_title: this.job_title,
                job_desc: this.job_desc,
                job_photos: this.job_photos,
                job_characteristics: this.job_characteristics,
                job_location: this.job_location,
                job_zipcode: this.job_zipcode,
                job_budget: this.job_budget,
                artist_preference: this.artist_preference,
                job_status: this.job_status,
                selected_artist_id: this.selected_artist_id,
                job_expiry_date: this.job_expiry_date,
                job_reviews: this.job_reviews,
                is_active: this.is_active,
                is_deleted: this.is_deleted,
                date_deleted: this.date_deleted,
                attr1: null,
                attr2: null,
                attr3: null,
                attr4: null,
                attr5: null,
                attr6: null,
                attr7: null,
                attr8: null
            }
            await db.collection('active-user-jobs').insertOne(finalJobObj)
            return finalJobObj
        }catch(err){
            console.log('Error saving job: ', err) //TODO: Handle this error
            return false
        }
    }

    static async addPhotoToJob(job_id, imageURL) {
        try {
            console.log('Adding to database: ', job_id)
            const result = await db.collection('active-user-jobs').findOneAndUpdate(
                { job_id }, 
                { $push: { job_photos: imageURL } }, 
                { returnOriginal: false }
            );
            
            if (!result) {
                console.log('Error: No job found with the provided job_id');
                return false;
            }
    
            return result.value;
        } catch (err) {
            console.log('Error adding photo to job: ', err); 
            return false;
        }
    }
    

    static async uploadJobPhoto(unxid, userFile, jobId ) {
        try {

            return new Promise((res, rej) => {
                if(!userFile){
                    console.log('No File Given: ') //TODO: Handle this error
                    rej(false)
                }

                const blob = bucket.file(`user-job-images/${userFile.originalname}-${unxid}`);

                const blobStream = blob.createWriteStream();

                blobStream.on('error', (err) => {
                    console.log('Google Error uploading file to the cloud: ', err);
                    rej(err);
                })
    
                blobStream.on('finish', async () => {
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                    await this.addPhotoToJob(jobId, publicUrl);
                    res(true);
                });
    
                blobStream.end(userFile.buffer);
            })

        } catch (error) {
            console.log('Error uploading File to host: ,', error) //TODO: Handle This error
            return false
        }
    }

    static async getJobByOwnerId(owner_id){
        try{
            const jobs = await db.collection('active-user-jobs').find({owner_id: owner_id}).toArray()
            return jobs
        }catch(err){
            console.log('Error getting jobs by owner id: ', err) //TODO: Handle this error
            return false
        }
    }

    static async updateJobById(job_id, updateData){
        try{
            const job = await db.collection('active-user-jobs').findOneAndUpdate({job_id}, {$set: updateData}, {returnOriginal: false})
            return job
        }catch(err){
            console.log('Error updating job by id: ', err) //TODO: Handle this error
            return false
        }
    }

    static async deleteJobById(job_id, unxid) {
        const session = await mongo.startSession();
        session.startTransaction();
    
        try {
            const result = await db.collection('active-user-jobs').findOneAndUpdate(
                { job_id }, 
                { $set: { is_active: false, is_deleted: true, date_deleted: new Date() } }, 
                { returnOriginal: false, session }
            );

            if(unxid !== result.value.owner_id){
                return false
            }
    
            if (!result.value) {
                return false
            }
    
            const job = result.value;
    
            await db.collection('inactive-user-jobs').insertOne(job, { session });
    
            await db.collection('active-user-jobs').deleteOne({ job_id }, { session });
    
            await session.commitTransaction();
    
            return true
    
        } catch (err) {
            await session.abortTransaction();
            return false
        } finally {
            session.endSession();
        }
    }
    

    static async getJobById(job_id){
        try{
            const job = await db.collection('active-user-jobs').findOne({job_id})
            return job
        }catch(err){
            console.log('Error getting job by id: ', err) //TODO: Handle this error
            return false
        }
    }

    static async getAllActiveJobs(){
        try{
            const jobs = await db.collection('active-user-jobs').find({is_active: true}).toArray()
            return jobs
        }catch(err){
            console.log('Error getting all active jobs: ', err) //TODO: Handle this error
            return false
        }
    }

    static async searchJobs(searchQuery){
        try{
            const jobs = await db.collection('active-user-jobs').find({$text: {$search: searchQuery}}).toArray()
            return jobs
        }catch(err){
            console.log('Error searching jobs: ', err) //TODO: Handle this error
            return false
        }
    }

    static async createJobBid(jobId, artistId, data, creatorId) {
        try {
            const newBidObj = {
                job_id: jobId,
                artist_id: artistId,
                job_owner_id: creatorId,
                proposed_price: data.bidAmount || null,
                proposed_date: null,
                artist_comments: data.artistDetails || null,
                timestamp: new Date(),
                is_active: true,
                is_deleted: false,
                attr1: null, // This is where the acceptedBid infor object will go.
                attr2: null,
                attr3: null,
                attr4: null,
                attr5: null,
                attr6: null,
                attr7: null,
                attr8: null
            }

            const result = await db.collection('active-job-bids').insertOne(newBidObj);
            if (result.acknowledged) {
                return await db.collection('active-job-bids').findOne({ _id: result.insertedId });
            }

            return false


        } catch (error) {
            console.log('Error Creating Job Bid: ', error) //!TODO: Handle This Error (LOG)
            return false
        }
    }

    static async getJobBidByOwnerId(owner_id){
        try{
            const jobs = await db.collection('active-job-bids').find({job_owner_id: owner_id, is_active: true, is_deleted: false}).toArray()
            return jobs
        }catch(err){
            console.log('Error getting jobs by owner id: ', err) //TODO: Handle this error
            return false
        }
    }

    static async getJobBidsByArtistId(artist_id){
        try{
            const jobs = await db.collection('active-job-bids').find({artist_id: artist_id, is_active: true, is_deleted: false}).toArray()
            return jobs
        }catch(err){
            console.log('Error getting jobs by artist id: ', err) //TODO: Handle this error
            return false
        }
    }

    static async getArtistDetailsForBid(artistId) {
        try {

            const data = await db.collection('user-artists-data').aggregate([
                {
                    $match: {
                        user_unxid: artistId
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "user_unxid",
                        foreignField: "unxid",
                        as: "user"
                    }
                },
                {
                    $lookup: {
                        from: "client-profile-image",
                        let: { user_unxid: "$user_unxid" },
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
                {
                    $lookup: {
                        from: "client-contact-info",
                        localField: "user_unxid",
                        foreignField: "user_unxid",
                        as: "contactInfo"
                    }
                },
                {
                    $lookup: {
                        from: "client-uploaded-images",
                        localField: "user_unxid",
                        foreignField: "user_unxid",
                        as: "userImages"
                    }
                },
                { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                { $unwind: { path: "$profileImage", preserveNullAndEmptyArrays: true } },
                { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
                { $unwind: { path: "$contactInfo", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        "user.password": 0,
                        "user.user_email": 0,
                        "user.session_token": 0,
                        "user.account_status": 0,
                        "user_isMod": 0,
                        "user.isAdmin": 0,
                        attr1: 0,
                        attr2: 0,
                        attr3: 0,
                        attr4: 0,
                        attr5: 0,
                        attr6: 0,
                        attr7: 0,
                        attr8: 0,
                        user_unxid: 0,
                        "user.subscription_active": 0,
                        "user.subscription_type": 0,
                        "user.subscription_start_date": 0,
                        "user.subscription_end_date": 0
                    }
                }
            ]).toArray();

            const artist = data[0];

            return artist;

            
        } catch (error) {
            console.log('Error Getting Artist Details For Bid: ', error)
            return false
        }
    }

    static async fetchPaginatedJobs(page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        try {
            const jobs = await db.collection('active-user-jobs').find(
                {is_active: true}).skip(skip).limit(limit).toArray()
            
            return jobs
        } catch (error) {
            console.log('Error fetching pagenated jobs: ', error) //TODO: Handle this error
            return false
        }
    }

    static async fetchPaginatedJobsLocation(page = 1, limit = 10, lat, lng, radius) {
        console.log('Starting fetchPaginatedJobsLocation'); //!REMOVE
        const skip = (page - 1) * limit;
        const radiusInMeters = radius ? radius * 1609.34 : null;
    
        let geoNearStage = {};
        if (lat !== undefined && lng !== undefined && radius !== undefined) {
            geoNearStage = {
                $geoNear: {
                    near: { type: "Point", coordinates: [ parseFloat(lng), parseFloat(lat) ] },
                    distanceField: "location_data.dist.calculated",
                    maxDistance: radiusInMeters,
                    spherical: true,
                    key: "location"
                }
            };
        } else {
            console.log('Latitude, Longitude, or Radius is undefined'); //!REMOVE
        }
    
        try {
            console.log('Running aggregation query'); //!REMOVE
            const jobs = await db.collection('job-location-data').aggregate([
                geoNearStage,
                {
                    $lookup: {
                        from: "active-user-jobs",
                        localField: "job_id",
                        foreignField: "job_id",
                        as: "job_info"
                    }
                },
                { $unwind: "$job_info" },
                { $match: { "job_info.is_active": true } },
                { $skip: skip },
                { $limit: limit },
                { $project: { job_info: 1, "location_data.dist.calculated": 1 } }
            ]).toArray();
    
            console.log('Jobs fetched:', jobs.length); //!REMOVE
            const mappedJobs = jobs.map(job => ({ ...job.job_info, distance: job.location_data.dist.calculated }));
            return mappedJobs;
        } catch (error) {
            console.error('Error fetching paginated jobs by location: ', error); //TODO: Handle this error
            return false;
        }
    }
    
      

async setJobLocationCords(job_id, owner_id, zipcode){
    try{
        const cords = await zipToCords(zipcode, owner_id);

        if(!cords){
            return false;
        }

        // Constructing the location data in GeoJSON format
        const locationData = {
            type: "Point",
            coordinates: [cords.lng, cords.lat] // Note: In GeoJSON, longitude comes first
        };

        const data = {
            job_id: job_id,
            owner_id: owner_id,
            location: locationData // Storing the GeoJSON object
        };
        
        await db.collection('job-location-data').insertOne(data);

        return true;
    } catch(err){
        console.error('Error setting job location cords: ', err);
        return false;
    }
}

    static async clientAcceptBid(job_id, artist_id ){
        try {
        
            console.log('Getting Original Job Data...') //!REMOVE
            const job = await db.collection('active-user-jobs').findOne({job_id})
            const bidData = await db.collection('active-job-bids').findOne({job_id, artist_id})

            if(!job){
                return false
            }

            console.log('Updating Job Data...') //!REMOVE
            const updatedJob = {
                ...job,
                selected_artist_id: artist_id,
                job_status: 'in-progress',
                is_active: false,
                attr1: bidData
            }
            
            console.log('Updating Job Data in DB...') //!REMOVE
            await db.collection('accepted-client-jobs').insertOne(updatedJob)

            console.log('Deleting Job Data from Active Jobs...') //!REMOVE
            await db.collection('active-user-jobs').deleteOne({job_id})


            console.log('Updating Job Bids...') //!REMOVE
            await db.collection('active-job-bids').updateMany({job_id}, {$set: {is_active: false}})

            console.log('Updating All Other Job Bids...') //!REMOVE
            await db.collection('active-job-bids').findOneAndUpdate(
                { job_id, artist_id }, 
                { $set: { is_active: false } }, 
                { returnOriginal: false }
            );

            console.log('SUCCESS: Job Accepted!') //!REMOVE

            return updatedJob

        } catch (error) {
            console.log('Error accepting bid: ', error) //TODO: Handle this error
            return false
        }
    }

    static getAcceptedJobsArtist(artist_id){
        try{
            const jobs = db.collection('accepted-client-jobs').find({selected_artist_id: artist_id}).toArray()
            return jobs
        }catch(err){
            console.log('Error getting accepted jobs: ', err) //TODO: Handle this error
            return false
        }
    }

    static async getAcceptedJobsOwner(owner_id){
        try{
            const jobs = await db.collection('accepted-client-jobs').find({owner_id}).toArray()
            return jobs
        }catch(err){
            console.log('Error getting accepted jobs: ', err) //TODO: Handle this error
            return false
        }
    }

    static async deleteJob(job_id, owner_id) {
        try {
            
            await db.collection('active-user-jobs').updateMany({
                job_id,
                owner_id
            }, {
                $set: {
                    is_active: false,
                    is_deleted: true,
                    date_deleted: new Date()
                }
            
            })

            await db.collection('active-job-bids').updateMany({
                job_id,
                job_owner_id: owner_id
            }, {
                $set: {
                    is_active: false,
                    is_deleted: true,
                    date_deleted: new Date()
                }
            
            })

            return true
            
        } catch (error) {
            console.log("Error Deleting Job", error) //!TODO: Handle This error
            return false
        }
    }

    static async getArtistDataForJob(artistId) {
        try {
            const artistData = await db.collection('user-artists-data').aggregate([
                {
                    $match: {
                        user_unxid: artistId
                    }
                },
                {
                    $lookup: {
                        from: "client-contact-info",
                        localField: "user_unxid",
                        foreignField: "user_unxid",
                        as: "contactInfo"
                    }
                },
                {
                    $lookup: {
                        from: "users", // Join with the users collection
                        localField: "user_unxid",
                        foreignField: "unxid", // Assuming 'unxid' is the connecting field in 'users'
                        as: "userInfo"
                    }
                },
                {
                    $unwind: "$userInfo" // Unwind the userInfo to simplify the data structure
                },
                {
                    $project: {
                        // Include all fields from user-artists-data and contactInfo
                        "user-artists-data": "$$ROOT",
                        "contactInfo": 1,
                        // Include only display_name and user_name from the users collection
                        "display_name": "$userInfo.display_name",
                        "user_name": "$userInfo.user_name"
                    }
                }
            ]).toArray();
    
            return artistData;
            
        } catch (error) {
            console.log('Error Getting Artist Data For Job: ', error);
            return false;
        }
    }

    static getAcceptedBidData = async (jobId) => {
        try {
            const bidData = await db.collection('accepted-client-jobs').findOne({ job_id: jobId });
            return bidData;
        } catch (error) {
            console.log('Error Getting Accepted Bid Data: ', error);
            return false;
        }
    }
    
    
    

}

module.exports = Job