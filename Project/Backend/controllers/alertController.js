const SecurityLog = require('../models/SecurityLog');

// @desc    Trigger special security alert & notifications
// @route   POST /api/alerts/dispatch
// @access  Public (or protected by operator token)
const dispatchAlert = async (req, res) => {
  try {
    const { cameraName, identity, confidence, severity, message } = req.body;

    // Create high-priority alert payload
    const alertData = {
      cameraName: cameraName || 'PRIMARY SECTOR',
      identity: identity || 'UNKNOWN INTRUDER',
      confidence: confidence || 95,
      behavior: message || 'CRITICAL BREACH: Special alert triggered by operator or automated defense protocol.',
      timestamp: new Date()
    };

    // Save to database
    const log = new SecurityLog(alertData);
    await log.save();

    // TODO: Add external webhook integrations here if needed (e.g., Twilio SMS, Telegram Bot API, or Webhook URL)
    console.warn(`[CRITICAL ALERT DISPATCHED] Sector: ${alertData.cameraName} | Threat: ${alertData.identity}`);

    res.status(201).json({
      success: true,
      message: 'Special alert successfully dispatched and logged.',
      data: log
    });
  } catch (error) {
    console.error("Alert Dispatch Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { dispatchAlert };