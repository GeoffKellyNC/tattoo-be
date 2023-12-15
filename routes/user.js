const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/userController')
const locationControllers = require('../controllers/locationController')
const multerUpload = require('../middleware/uploadMiddleware');





router
    .route('/check-user-name/:user_name')
    .get(userControllers.checkUserNameExists)

router
    .route('/register')
    .post(userControllers.createUser)

router
    .route('/upload-profile-image')
    .post(multerUpload.single('profile-image'), userControllers.uploadProfileImage)

router
    .route('/get-profile-image')
    .get(userControllers.getActiveProfileImage)

router
    .route('/update-client-profile-details')
    .post(userControllers.updateProfileDetailsClient)

router
    .route('/upload-client-images')
    .post(multerUpload.single('client-user-image'), userControllers.uploadClientImages)

router
    .route('/get-client-images')
    .get(userControllers.getClientUploadedImages)

router
    .route('/get-paginated-users')
    .get(userControllers.fetchPaginatedUsers);

router
    .route('/get-user-profile-by-id/:user_id')
    .get(userControllers.fetchUserProfileByUnxid);

router
    .route('/update-verificatoin-email')
    .post(userControllers.updateUserEmailForVerification);


router
    .route('/location-data')
    .post(locationControllers.getUserLocationData)

router
    .route('/update-user-data')
    .post(userControllers.updateUserData)

router
    .route('/update-artist-details')
    .post(userControllers.updateArtistDetails)

router
    .route('/get-artist-details')
    .get(userControllers.getArtistDetails)

router
    .route('/update-contact-info')
    .post(userControllers.updateContactDetails)

router
    .route('/get-contact-details')
    .get(userControllers.getContactDetails)


    


module.exports = router;