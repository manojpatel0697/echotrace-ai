/**
 * Analytics Routes
 * REST API endpoints for analytics and anomaly data
 */

const express = require('express');
const router = express.Router();
const AnomalyEvent = require('../models/AnomalyEvent');
const SignalLog = require('../models/SignalLog');
const mongoose = require('mongoose');

// GET /api/analytics/anomalies — get anomaly events
router.get('/anomalies', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: [], message: 'MongoDB not connected' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const data = await AnomalyEvent.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, data, count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/summary — get analytics summary
router.get('/summary', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        data: {
          totalLogs: 0,
          totalAnomalies: 0,
          avgOccupancy: 0,
          avgMovement: 0,
          message: 'MongoDB not connected — showing defaults',
        },
      });
    }

    const [logCount, anomalyCount, avgStats] = await Promise.all([
      SignalLog.countDocuments(),
      AnomalyEvent.countDocuments(),
      SignalLog.aggregate([
        {
          $group: {
            _id: null,
            avgOccupancy: { $avg: '$occupancyProbability' },
            avgMovement: { $avg: '$movementIntensity' },
            maxOccupancy: { $max: '$occupancyProbability' },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalLogs: logCount,
        totalAnomalies: anomalyCount,
        avgOccupancy: Math.round(avgStats[0]?.avgOccupancy || 0),
        avgMovement: Math.round(avgStats[0]?.avgMovement || 0),
        maxOccupancy: Math.round(avgStats[0]?.maxOccupancy || 0),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/heatmap — get occupancy heatmap data
router.get('/heatmap', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Return synthetic heatmap data
      const syntheticData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        avgOccupancy: Math.round(Math.random() * 60 + (hour >= 9 && hour <= 18 ? 30 : 0)),
        count: Math.floor(Math.random() * 100),
      }));
      return res.json({ success: true, data: syntheticData });
    }

    const data = await SignalLog.aggregate([
      {
        $group: {
          _id: { $hour: '$timestamp' },
          avgOccupancy: { $avg: '$occupancyProbability' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          hour: '$_id',
          avgOccupancy: { $round: ['$avgOccupancy', 0] },
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
