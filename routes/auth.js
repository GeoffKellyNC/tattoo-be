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



module.exports = router;