/**
 * API Route Tests
 */

const request = require('supertest');

// Mock mongoose before requiring app
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: { readyState: 0 },
  Schema: Object.assign(
    jest.fn().mockImplementation(() => ({
      index: jest.fn().mockReturnThis(),
    })),
    {
      Types: {
        Mixed: {},
        ObjectId: {},
        String: String,
        Number: Number,
        Boolean: Boolean,
      },
    }
  ),
  model: jest.fn().mockReturnValue({
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
  }),
}));

// Mock socket.io
jest.mock('socket.io', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    use: jest.fn(),
  }));
});

// Mock services
jest.mock('../services/signalSimulator', () => ({
  startSignalSimulator: jest.fn(),
  getSimulatorState: jest.fn().mockReturnValue({
    isRunning: true,
    isDemoMode: false,
    currentScenario: 'idle',
    deviceCount: 2,
    sessionId: 'test-session',
    tick: 100,
    scenarios: [],
  }),
  activateDemoMode: jest.fn(),
  deactivateDemoMode: jest.fn(),
  injectRealScanData: jest.fn(),
  SCENARIOS: {
    idle: { name: 'Idle Room', deviceCount: 1, fluctuation: 2, drift: 0.5, description: 'Empty room' },
  },
}));

jest.mock('../agents/orchestrator', () => ({
  initAgentOrchestrator: jest.fn(),
  getMessageHistory: jest.fn().mockReturnValue([]),
  getAgents: jest.fn().mockReturnValue([
    { id: 'signal', name: 'Signal Agent', icon: '📡', color: '#00d4ff' },
  ]),
}));

jest.mock('../services/geminiService', () => ({
  interpretSignalData: jest.fn().mockResolvedValue({
    message: 'Test interpretation',
    source: 'fallback',
    confidence: 75,
  }),
  initGemini: jest.fn().mockReturnValue(false),
}));

jest.mock('../services/socketService', () => ({
  initSocketHandlers: jest.fn(),
  getConnectedClients: jest.fn().mockReturnValue(0),
}));

const express = require('express');
const signalRoutes = require('../routes/signal');
const aiRoutes = require('../routes/ai');
const analyticsRoutes = require('../routes/analytics');

// Build a minimal test app
const buildTestApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/health', (req, res) => res.json({ status: 'operational' }));
  app.use('/api/signal', signalRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/analytics', analyticsRoutes);
  return app;
};

describe('Health Check', () => {
  it('GET /health returns operational status', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('operational');
  });
});

describe('Signal Routes', () => {
  let app;
  beforeAll(() => { app = buildTestApp(); });

  it('GET /api/signal/status returns simulator state', async () => {
    const res = await request(app).get('/api/signal/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('GET /api/signal/scenarios returns scenario list', async () => {
    const res = await request(app).get('/api/signal/scenarios');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/signal/analyze returns analysis', async () => {
    const res = await request(app)
      .post('/api/signal/analyze')
      .send({
        devices: [
          { id: 'dev1', rssi: -60, rssiHistory: [-60, -65, -58] },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.occupancyProbability).toBeDefined();
  });

  it('POST /api/signal/analyze returns 400 without devices', async () => {
    const res = await request(app)
      .post('/api/signal/analyze')
      .send({});
    expect(res.status).toBe(400);
  });

  it('GET /api/signal/history returns array', async () => {
    const res = await request(app).get('/api/signal/history');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('AI Routes', () => {
  let app;
  beforeAll(() => { app = buildTestApp(); });

  it('GET /api/ai/agents returns agent list', async () => {
    const res = await request(app).get('/api/ai/agents');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/ai/history returns message history', async () => {
    const res = await request(app).get('/api/ai/history');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/ai/interpret returns interpretation', async () => {
    const res = await request(app)
      .post('/api/ai/interpret')
      .send({
        signalData: {
          occupancyProbability: 65,
          movementIntensity: 40,
          activityLevel: 'moderate',
          variance: 25,
          deviceCount: 2,
          anomalies: [],
        },
        agentType: 'presence',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBeDefined();
  });

  it('POST /api/ai/interpret returns 400 without signalData', async () => {
    const res = await request(app)
      .post('/api/ai/interpret')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('Analytics Routes', () => {
  let app;
  beforeAll(() => { app = buildTestApp(); });

  it('GET /api/analytics/summary returns summary', async () => {
    const res = await request(app).get('/api/analytics/summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/analytics/anomalies returns array', async () => {
    const res = await request(app).get('/api/analytics/anomalies');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/analytics/heatmap returns heatmap data', async () => {
    const res = await request(app).get('/api/analytics/heatmap');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
