const mongoose = require('mongoose');

const SecurityLogSchema = new mongoose.Schema({
  cameraId: { type: String, required: true },
  cameraName: { type: String, required: true },
  eventType: { type: String, default: 'ZONE_BREACH' },
  identity: { type: String, required: true },
  confidence: { type: Number, required: true },
  behavior: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SecurityLog', SecurityLogSchema);