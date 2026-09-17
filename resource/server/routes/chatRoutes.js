const express = require('express');
const { sendMessage, getConversation, listConversations } = require('../controllers/chatController');


const router = express.Router();


router.post('/send', sendMessage);
router.get('/conversations', listConversations);
router.get('/conversations/:id', getConversation);


module.exports = router;