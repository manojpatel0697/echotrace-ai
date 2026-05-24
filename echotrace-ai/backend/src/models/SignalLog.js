/**
 * SignalLog Model — stores RSSI readings and occupancy events
 */

const mongoose = require('mongoose');

const signalLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  deviceId: { type: String, required: true },
  deviceName: { type: String, default: 'Unknown Device' },
  rssi: { type: Number, required: true },          // dBm value
  variance: { type: Number, default: 0 },
  instability: { type: Number, default: 0 },       // 0–1 normalized
  occupancyProbability: { type: Number, default: 0 }, // 0–100
  movementIntensity: { type: Number, default: 0 },    // 0–100
  activityLevel: {
    type: String,
    enum: ['idle', 'low', 'moderate', 'high', 'intense'],
    default: 'idle',
  },
  isAnomaly: { type: Boolean, default: false },
  sessionId: { type: String, index: true },
}, {
  timestamps: true,
  collection: 'signal_logs',
});

signalLogSchema.index({ timestamp: -1, sessionId: 1 });

module.exports = mongoose.model('SignalLog', signalLogSchema);
