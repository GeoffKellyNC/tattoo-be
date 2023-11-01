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

router
    .route('/reset-password')
    .post(authControllers.resetUserPassword)

router
    .route('/reset-password-verify')
    .post(authControllers.sendResetPasswordEmail)

router
    .route('/decode-token')
    .get(authControllers.decodeJWTPayload)


router
    .route('/check-email')
    .post(authControllers.checkIfEmailExists)




module.exports = router;