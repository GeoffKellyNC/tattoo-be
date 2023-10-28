import Job from '../models/Job.js'

exports.createJob = async (req, res) => {
    try {
        const { jobData } = req.body;

        if(!jobData){
            res.status(400).json({message: 'Error: Invalid Job Data!'})
            return
        }

        const job = new Job(jobData);

        const jobSaved = await job.save();

        res.status(200).json({ message: 'Job created successfully', data: jobSaved })

    } catch (error) {
        console.log('Error creating job: ', error) //TODO: Handle this error
        res.status(500).json({ message: 'Error creating job', error })
        return
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

