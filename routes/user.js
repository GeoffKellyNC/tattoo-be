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


module.exports = router;