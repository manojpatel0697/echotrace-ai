/**
 * EchoTrace AI - Backend Entry Point
 * Wireless Human Presence & Movement Sensing Platform
 */

// Must be first — fixes Windows DNS SRV lookup for MongoDB Atlas
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const signalRoutes = require('./routes/signal');
const aiRoutes = require('./routes/ai');
const analyticsRoutes = require('./routes/analytics');
const { initSocketHandlers } = require('./services/socketService');
const { startSignalSimulator } = require('./services/signalSimulator');
const { initAgentOrchestrator } = require('./agents/orchestrator');

const app = express();
const server = http.createServer(app);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'https://echotrace-ai.vercel.app',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
  transports: ['websocket', 'polling'],
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    service: 'EchoTrace AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/signal', signalRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[EchoTrace Error]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── MongoDB ──────────────────────────────────────────────────────────────────
const connectMongo = async () => {
  if (!process.env.MONGODB_URI) {
    console.log('[MongoDB] No URI — running without persistence');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      family: 4,
    });
    console.log('[MongoDB] Connected —', mongoose.connection.host);
  } catch (err) {
    console.warn('[MongoDB] Connection failed — in-memory mode:', err.message);
  }
};

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

const bootstrap = async () => {
  await connectMongo();
  initSocketHandlers(io);
  startSignalSimulator(io);
  initAgentOrchestrator(io);

  server.listen(PORT, () => {
    console.log(`\n🚀 EchoTrace AI Backend — port ${PORT} — ${process.env.NODE_ENV || 'development'}\n`);
  });
};

bootstrap();

module.exports = { app, server, io };
