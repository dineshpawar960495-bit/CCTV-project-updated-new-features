const express = require('express');
const router = express.Router();
const { dispatchAlert } = require('../controllers/alertController');

router.post('/dispatch', dispatchAlert);

module.exports = router;