const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');

router.post('/check-availability', hotelController.checkAvailability);

module.exports = router;
