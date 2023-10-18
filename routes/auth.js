const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authController');



// Auth Routes

router
    .route('/login-google')
    .post(authControllers.getLinkGoogle)

router
    .route('/login-google')
    .get(authControllers.loginGoogle)

router
    .route('/login')
    .post(authControllers.login)

router
    .route('/verify-user-access')
    .get(authControllers.verifyUserAccess)

router
    .route('/logout')
    .post(authControllers.logout)



module.exports = router;