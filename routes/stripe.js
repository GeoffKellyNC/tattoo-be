const express = require('express');
const router = express.Router();
const stripeContoller = require('../controllers/stripeController');



router 
    .route('/create-checkout-session')
    .post(stripeContoller.createCheckoutSession)



module.exports = router;
