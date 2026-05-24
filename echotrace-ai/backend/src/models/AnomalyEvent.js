/**
 * AnomalyEvent Model — stores detected anomaly events
 */

const mongoose = require('mongoose');

const anomalyEventSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  type: {
    type: String,
    enum: ['rssi_spike', 'rapid_movement', 'occupancy_surge', 'signal_dropout', 'pattern_anomaly'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  description: { type: String, required: true },
  rssiSnapshot: [Number],
  occupancyAtEvent: { type: Number, default: 0 },
  aiInterpretation: { type: String, default: '' },
  sessionId: { type: String, index: true },
  resolved: { type: Boolean, default: false },
}, {
  timestamps: true,
  collection: 'anomaly_events',
});

module.exports = mongoose.model('AnomalyEvent', anomalyEventSchema);
