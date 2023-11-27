const express = require('express');
const router = express.Router();
const jobControllers = require('../controllers/jobController');
const multerUpload = require('../middleware/uploadMiddleware');


router
    .route('/create-job')
    .post(jobControllers.createJob); 

router
    .route('/get-all-active-jobs')
    .get(jobControllers.getAllActiveJobs)

router
    .route('/search-jobs')
    .post(jobControllers.searchJobs)

router
    .route('/get-user-jobs')
    .get(jobControllers.getUserJobs)

router
    .route('/add-photos-to-job')
    .post(multerUpload.array('photos[]', 10), jobControllers.addPhotosToJob)

router
    .route('/get-job-bids')
    .get(jobControllers.getJobBidsForOwner)

router
    .route('/create-job-bid')
    .post(jobControllers.createJobBid)


module.exports = router;