const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/userController')




router
    .route('/check-user-name/:user_name')
    .get(userControllers.checkUserNameExists)

router
    .route('/create-user')
    .post(userControllers.createUser)


module.exports = router;