/**
 * AIInterpretation Model — stores Gemini AI analysis results
 */

const mongoose = require('mongoose');

const aiInterpretationSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  agentType: {
    type: String,
    enum: ['signal', 'presence', 'activity', 'safety', 'analytics'],
    required: true,
  },
  message: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 100, default: 75 },
  occupancyEstimate: { type: Number, default: 0 },
  movementEstimate: { type: Number, default: 0 },
  rawSignalData: { type: mongoose.Schema.Types.Mixed },
  sessionId: { type: String, index: true },
  isDemo: { type: Boolean, default: false },
}, {
  timestamps: true,
  collection: 'ai_interpretations',
});

module.exports = mongoose.model('AIInterpretation', aiInterpretationSchema);
