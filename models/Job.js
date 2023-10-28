require("dotenv").config();
const { mongo } = require('../db/config')
const { v4: uuid} = require('uuid');


const db = mongo.db(process.env.MONGO_DB_NAME)



class Job {
    constructor(data){
        this.job_id = uuid();               
        this.owner_id = data.owner_unxid;            
        this.job_created_date = new Date();             
        this.job_title = data.job_title;                
        this.job_desc = data.job_desc;                  
        this.job_photos = data.job_photos || [];        
        this.job_characteristics = data.job_characteristics || {}; 
        this.job_location = data.job_location;           
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

    async save(){
        try{
            const job = await db.collection('active_user_jobs').insertOne(this)
            return job
        }catch(err){
            throw err
        }
    }

    static async getJobByOwnerId(owner_id){
        try{
            const jobs = await db.collection('active_user_jobs').find({owner_id}).toArray()
            return jobs
        }catch(err){
            throw err
        }
    }

    static async updateJobById(job_id, updateData){
        try{
            const job = await db.collection('active_user_jobs').findOneAndUpdate({job_id}, {$set: updateData}, {returnOriginal: false})
            return job
        }catch(err){
            throw err
        }
    }

    static async getJobById(job_id){
        try{
            const job = await db.collection('active_user_jobs').findOne({job_id})
            return job
        }catch(err){
            throw err
        }
    }

    static async getAllActiveJobs(){
        try{
            const jobs = await db.collection('active_user_jobs').find({is_active: true}).toArray()
            return jobs
        }catch(err){
            throw err
        }
    }

    static async searchJobs(searchQuery){
        try{
            const jobs = await db.collection('active_user_jobs').find({$text: {$search: searchQuery}}).toArray()
            return jobs
        }catch(err){
            throw err
        }
    }
}

module.exports = Job