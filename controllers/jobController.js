const Job = require('../models/Job')

exports.createJob = async (req, res) => {
    console.log('Req Body:', req.body); //!REMOVE
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
        console.log('Error creating job:', error); //!REMOVE
        res.status(500).json({ message: 'Error creating job', error });
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

        console.log(' Getting user Jobs user_id: ', user_id) //!REMOVE

        if(!user_id){
            res.status(400).json({message: 'Error: Invalid User ID!'})
            return
        }

        const jobs = await Job.getJobByOwnerId(user_id);

        console.log('Jobs: ', jobs) //!REMOVE

        res.status(200).json({ message: 'Jobs retrieved successfully', data: jobs })

    } catch (error) {
        console.log('Error retrieving jobs: ', error) //TODO: Handle this error
        res.status(500).json({ message: 'Error retrieving jobs', error })
        return
    }
}

