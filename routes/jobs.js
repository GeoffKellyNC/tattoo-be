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
    .route('/get-job-bids-client')
    .get(jobControllers.getJobBidsForOwner)

router
    .route('/get-job-bids-artist')
    .get(jobControllers.getJobBidsForArtist)

router
    .route('/create-job-bid')
    .post(jobControllers.createJobBid)

router
    .route('/get-job-by-id/:jobId')
    .get(jobControllers.getJobById)

router
    .route('/get-artist-details-bid/:artistId')
    .get(jobControllers.getArtistDetailsForBid)

router
    .route('/get-paginated-jobs')
    .get(jobControllers.fetchPaginatedJobs);

router
    .route('/get-paginated-job-location')
    .get(jobControllers.fetchPaginatedJobsLocation);

router
    .route('/accept-bid')
    .post(jobControllers.clientAcceptBid)

router
    .route('/get-accepted-jobs-artist')
    .get(jobControllers.getAcceptedJobsForArtist)


module.exports = router;