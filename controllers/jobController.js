const Job = require('../models/Job')
const sanitizeBidData = require('../util/sanitizeBidData');
const socketService = require('../services/socketService');

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
        const locationSave = await job.setJobLocationCords(jobSaved.job_id, unxid, jobSaved.job_zipcode)


        if (!jobSaved) {
            res.status(500).json({ message: 'Failed to save job' });
            return;
        }

        if(!locationSave){
            res.status(500).json({ message: 'Failed to save job location' });
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

        const { jobId, artistId, data, jobOwnerId, jobTitle } = req.body;

        const newBid = await Job.createJobBid(jobId, artistId, data, jobOwnerId);

        if(!newBid){
            res.status(400).json({message: 'Error creating job bid'})
            return
        }

        socketService.emitToUser(jobOwnerId, "data_notification", { active: true, message: `You have a new bid for ${jobTitle}` })

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

exports.fetchPaginatedJobs = async (req, res) => {
    try {
        console.log('Fetching paginated jobs') //!REMOVE
        const { page, limit } = req.query;

        console.log('Page: ', page) //!REMOVE
        console.log('Limit: ', limit) //!REMOVE

        const users = await Job.fetchPaginatedJobs(parseInt(page, 10), parseInt(limit, 10));

        if(!users){
            res.status(400).json({message: 'Error retrieving paginated jobs'})
            return
        }

        res.status(200).json({ data: users })
        
    } catch (error) {
        console.log('Error fetching paginated jobs: ', error) //TODO: Handle this error
        res.status(500).json({ message: 'Error fetching paginated jobs', error })
    }
}
    

exports.fetchPaginatedJobsLocation = async (req, res) => {
    try {
        const { page, limit, lat, lng, radius } = req.query;


        const jobs = await Job.fetchPaginatedJobsLocation(parseInt(page, 10), parseInt(limit, 10), parseFloat(lat), parseFloat(lng), parseFloat(radius));


        if(!jobs){
            res.status(400).json({message: 'Error retrieving paginated jobs'})
            return
        }

        res.status(200).json({ data: jobs })

    } catch (error) {
        res.status(500).json({ message: 'Error fetching paginated jobs', error })
    }
}

exports.clientAcceptBid = async (req, res) => {
    try {

        console.log('Client Accept Bid Route... ') //!REMOVE
        const user_id = req.headers["user_unx_id"]

        const { job_id, artist_id} = req.body

        console.log('Starting Accept Bid Process...') //!REMOVE
        const updatedJobData = await Job.clientAcceptBid(job_id, artist_id)

        if(!updatedJobData){
            socketService.emitToUser(user_id, 'notification', {
                message: 'Error Accepting Job Bid! Please try again',
                type: 'error'
            })
            res.status(500).json({message: 'There was an issue accepting bid.'})
        }

        console.log('Sending Socket Notification...') //!REMOVE
        socketService.emitToUser(user_id, 'notification', {
            message: `Succesfully Accepted Bid for ${updatedJobData.job_title} `,
            type: 'info'
        })

        console.log('Sending Response...') //!REMOVE
        res.status(200).json({message: 'Success', data: updatedJobData})
        return

        
    } catch (error) {
        console.log('Error accepting bid: ', error) //TODO: Handle this error
        res.status(500).json({ message: 'Error Accepting Bid', error})
        return
    }
}

exports.getAcceptedJobsForArtist = async (req, res) => {   
    try {
        const user_id = req.headers["user_unx_id"]

        if(!user_id){
            res.status(400).json({message: 'Error: Invalid User ID!'})
            return
        }

        const jobs = await Job.getAcceptedJobsArtist(user_id);

        if(!jobs){
            res.status(400).json({message: 'Error retrieving jobs'})
            return
        }

        res.status(200).json({ message: 'Jobs retrieved successfully', data: jobs })

    } catch (error) {
        console.log('Error retrieving jobs: ', error) //TODO: Handle this error
        res.status(500).json({ message: 'Error retrieving jobs', error })
        return
    }
}
