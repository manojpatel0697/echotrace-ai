/**
 * AI Routes
 * REST API endpoints for Gemini AI interpretations
 */

const express = require('express');
const router = express.Router();
const { interpretSignalData } = require('../services/geminiService');
const { getMessageHistory, getAgents } = require('../agents/orchestrator');
const AIInterpretation = require('../models/AIInterpretation');
const mongoose = require('mongoose');

// GET /api/ai/agents — list all agents
router.get('/agents', (req, res) => {
  res.json({
    success: true,
    data: getAgents(),
  });
});

// GET /api/ai/history — get AI message history
router.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  res.json({
    success: true,
    data: getMessageHistory(limit),
  });
});

// POST /api/ai/interpret — on-demand AI interpretation
router.post('/interpret', async (req, res) => {
  const { signalData, agentType } = req.body;

  if (!signalData) {
    return res.status(400).json({ error: 'signalData required' });
  }

  try {
    const result = await interpretSignalData(signalData, agentType || 'presence');

    // Persist to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      await AIInterpretation.create({
        agentType: agentType || 'presence',
        message: result.message,
        confidence: result.confidence,
        occupancyEstimate: signalData.occupancyProbability || 0,
        movementEstimate: signalData.movementIntensity || 0,
        rawSignalData: signalData,
      }).catch(err => console.warn('[AI Route] DB save failed:', err.message));
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/interpretations — get stored interpretations
router.get('/interpretations', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: [], message: 'MongoDB not connected' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const data = await AIInterpretation.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
