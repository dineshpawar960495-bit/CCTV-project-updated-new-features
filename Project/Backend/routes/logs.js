const express = require('express');
const router = express.Router();
const SecurityLog = require('../models/SecurityLog');

// POST: Save a new breach event
router.post('/breach', async (routerReq, res) => {
  try {
    const log = new SecurityLog(routerReq.body);
    await log.save();
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Retrieve all logs
router.get('/', async (routerReq, res) => {
  try {
    const logs = await SecurityLog.find().sort({ timestamp: -1 }).limit(100);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;