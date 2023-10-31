const express = require('express');
const router = express.Router();
const stripeContoller = require('../controllers/stripeController');



router 
    .route('/create-checkout-session')
    .post(stripeContoller.createCheckoutSession)


router
    .route('/webhook')
    .post(express.raw({type: 'application/json'}), stripeContoller.stripeWebhook)


module.exports = router;


