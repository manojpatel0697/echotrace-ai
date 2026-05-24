/**
 * Signal Routes
 * REST API endpoints for signal data and simulator control
 */

const express = require('express');
const router = express.Router();
const { getSimulatorState, injectRealScanData, SCENARIOS } = require('../services/signalSimulator');
const { analyzeSignals } = require('../utils/signalAnalysis');
const SignalLog = require('../models/SignalLog');
const mongoose = require('mongoose');

// GET /api/signal/status — current simulator status
router.get('/status', (req, res) => {
  res.json({ success: true, data: getSimulatorState() });
});

// GET /api/signal/scenarios — available demo scenarios
router.get('/scenarios', (req, res) => {
  res.json({
    success: true,
    data: Object.entries(SCENARIOS).map(([key, val]) => ({ key, ...val })),
  });
});

// POST /api/signal/analyze — analyze provided signal data
router.post('/analyze', (req, res) => {
  const { devices } = req.body;
  if (!devices || !Array.isArray(devices)) {
    return res.status(400).json({ error: 'devices array required' });
  }
  const analysis = analyzeSignals(devices);
  res.json({ success: true, data: analysis });
});

// GET /api/signal/history — get signal log history from MongoDB
router.get('/history', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: [], message: 'MongoDB not connected' });
    }
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const logs = await SignalLog.find().sort({ timestamp: -1 }).limit(limit).lean();
    res.json({ success: true, data: logs, count: logs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/signal/scanner — receive data from Python BT scanner
router.post('/scanner', (req, res) => {
  const { devices, sessionId } = req.body;
  if (!devices || !Array.isArray(devices)) {
    return res.status(400).json({ error: 'devices array required' });
  }
  // Inject directly into the simulator pipeline
  injectRealScanData(null, devices);
  res.json({
    success: true,
    message: 'Scanner data injected',
    deviceCount: devices.length,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
