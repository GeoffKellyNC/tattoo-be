const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/userController')
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

    


module.exports = router;