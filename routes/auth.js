const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authController');



// Auth Routes

router
    .route('/login')
    .post(authControllers.login)

router
    .route('/verify-user-access')
    .get(authControllers.verifyUserAccess)

router
    .route('/logout')
    .post(authControllers.logout)

router
    .route('/verify-email')
    .get(authControllers.verifyEmailController)

router
    .route('/update-user-password')
    .post(authControllers.updateUserPassword)




module.exports = router;