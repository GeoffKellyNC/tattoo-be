const express = require('express');
const router = express.Router();
const aiControllers = require('../controllers/aiControllers');


router
    .route('/ai-moderation-text')
    .post(aiControllers.aiModerationText);


module.exports = router;