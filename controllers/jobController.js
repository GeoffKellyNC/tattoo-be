const Job = require('../models/Job')
const sanitizeBidData = require('../util/sanitizeBidData');

exports.createJob = async (req, res) => {
    try {
        const jobData = req.body;
        const unxid = req.headers["user_unx_id"];
        if(!jobData || !unxid) {
            res.status(400).json({message: 'Error: Invalid Data!'});
            return;
        }

        const job = new Job(jobData, unxid);
        const jobSaved = await job.save();
        if (!jobSaved) {
            res.status(500).json({ message: 'Failed to save job' });
            return;
        }
        
        res.status(200).json({ message: 'Job created successfully', data: jobSaved });
    } catch (error) {
        res.status(500).json({ message: 'Error creating job', error });
    }
}

exports.addPhotosToJob = async (req, res) => {
    try {
        const job_id  = req.body.jobId;
        const unxid = req.headers["user_unx_id"];
        const files = req.files;


        await files.forEach(file => {
            console.log('Uploading for Job:', job_id)
            console.log('Uploading File: ', file)
            Job.uploadJobPhoto(unxid, file, job_id)
            console.log('Uploaded....')
        })

        const updatedJob = await Job.getJobById(job_id)

        res.status(200).json({ message: 'Photo added to job successfully', data: updatedJob });
    } catch (error) {
        console.log('Error adding photo to job:', error); //TODO: Handle this error
        res.status(500).json({ message: 'Error adding photo to job', error });
    }
}





exports.getAllActiveJobs = async (req, res) => {
    try {

        const jobs = await Job.getAllActiveJobs();

        res.status(200).json({ message: 'Jobs retrieved successfully', data: jobs })

    } catch (error) {
        console.log('Error retrieving jobs: ', error) //TODO: Handle this error
        res.status(500).json({ message: 'Error retrieving jobs', error })
        return
    }
}

exports.searchJobs = async (req, res) => {
    try {
        const { searchQuery } = req.body;

        if(!searchQuery){
            res.status(400).json({message: 'Error: Invalid Search Query!'})
            return
        }

        const jobs = await Job.searchJobs(searchQuery);

        res.status(200).json({ message: 'Jobs retrieved successfully', data: jobs })

    } catch (error) {
        console.log('Error retrieving jobs: ', error) //TODO: Handle this error
        res.status(500).json({ message: 'Error retrieving jobs', error })
        return
    }
}

exports.getUserJobs = async (req, res) => {
    try {
        const user_id = req.headers["user_unx_id"]


        if(!user_id){
            res.status(400).json({message: 'Error: Invalid User ID!'})
            return
        }

        const jobs = await Job.getJobByOwnerId(user_id);


        res.status(200).json({ message: 'Jobs retrieved successfully', data: jobs })

    } catch (error) {
        console.log('Error retrieving jobs: ', error) //TODO: Handle this error
        res.status(500).json({ message: 'Error retrieving jobs', error })
        return
    }
}


exports.createJobBid = async (req, res) => {
    try {

        const { jobId, artistId, data, jobOwnerId } = req.body;

        const newBid = await Job.createJobBid(jobId, artistId, data, jobOwnerId);

        if(!newBid){
            res.status(400).json({message: 'Error creating job bid'})
            return
        }

        res.status(200).json({ message: 'Job bid created successfully', data: newBid })
        
    } catch (error) {
        console.log('Error creating job bid: ', error) //TODO: Handle this error
        res.status(500).json({ message: 'Error creating job bid', error })
        return
    }
}

exports.getJobBidsForOwner = async (req, res) => {
    try {
        const user_id = req.headers["user_unx_id"]

        if(!user_id){
            res.status(400).json({message: 'Error: Invalid User ID!'})
            return
        }

        const jobBids = await Job.getJobBidByOwnerId(user_id);



        if(!jobBids){
            res.status(400).json({message: 'Error retrieving job bids'})
            return
        }

        res.status(200).json({ message: 'Job bids retrieved successfully', data: jobBids })
        
    } catch (error) {
        console.log('Error retrieving job bids: ', error) //TODO: Handle this error
        res.status(500).json({ message: 'Error retrieving job bids', error })
        return
    }
}

exports.getJobBidsForArtist = async (req, res) => {
    try {
        const user_id = req.headers["user_unx_id"]

        if(!user_id){
            res.status(400).json({message: 'Error: Invalid User ID!'})
            return
        }

        const jobBids = await Job.getJobBidsByArtistId(user_id);

        if(!jobBids){
            res.status(400).json({message: 'Error retrieving job bids'})
            return
        }

    //    const sanitizedData =  await sanitizeBidData(jobBids)

        res.status(200).json({ message: 'Job bids retrieved successfully', data: jobBids })
        
    } catch (error) {
        console.log('Error retrieving job bids: ', error) //TODO: Handle this error
        res.status(500).json({ message: 'Error retrieving job bids', error })
        return
    }
}

exports.getJobById = async (req, res) => {
    try {
        const jobId = req.params.jobId

        if(!jobId){
            res.status(400).json({message: 'Error: Invalid Job ID!'})
            return
        }

        const job = await Job.getJobById(jobId);

        if(!job){
            res.status(400).json({message: 'Error retrieving job'})
            return
        }

        res.status(200).json({ message: 'Job retrieved successfully', data: job })
        
    } catch (error) {
        console.log('Error retrieving job: ', error) //TODO: Handle this error
        res.status(500).json({ message: 'Error retrieving job', error })
    }
}

exports.getArtistDetailsForBid = async (req, res) => {
    try {
        console.log('Getting artist details for bid') //!REMOVE
        const artistId = req.params.artistId

        if(!artistId){
            res.status(400).json({message: 'Error: Invalid Artist ID!'})
            return
        }

        const artistData = await Job.getArtistDetailsForBid(artistId);

        if(!artistData){
            res.status(400).json({message: 'Error retrieving artist data'})
            return
        }

        console.log('Artist Data: ', artistData)//!REMOVE

        res.status(200).json({ message: 'Artist data retrieved successfully', data: artistData })
        
    } catch (error) {
        console.log('Error retrieving artist data: ', error) //TODO: Handle this error
        res.status(500).json({ message: 'Error retrieving artist data', error })
    }
}

