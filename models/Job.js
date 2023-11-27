require("dotenv").config();
const { mongo } = require('../db/config')
const { v4: uuid} = require('uuid');
const { bucket } = require('../google/gcs-img-config')


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
            const job = await db.collection('active-user-jobs').insertOne(this)
            return this
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
}

module.exports = Job