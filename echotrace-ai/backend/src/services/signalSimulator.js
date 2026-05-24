/**
 * Signal Simulator Service
 * Generates realistic Bluetooth RSSI data for demo/fallback mode
 * Mimics real-world signal behavior patterns
 */

const { analyzeSignals } = require('../utils/signalAnalysis');
const { v4: uuidv4 } = require('uuid');

// ─── Device Pool ──────────────────────────────────────────────────────────────
const DEVICE_TEMPLATES = [
  { name: 'iPhone 15 Pro', type: 'phone', baseRssi: -55 },
  { name: 'Samsung Galaxy S24', type: 'phone', baseRssi: -62 },
  { name: 'MacBook Pro', type: 'laptop', baseRssi: -48 },
  { name: 'AirPods Pro', type: 'earbuds', baseRssi: -70 },
  { name: 'Apple Watch Ultra', type: 'wearable', baseRssi: -65 },
  { name: 'Pixel 8', type: 'phone', baseRssi: -58 },
  { name: 'Surface Pro', type: 'laptop', baseRssi: -52 },
  { name: 'Galaxy Buds', type: 'earbuds', baseRssi: -72 },
];

// ─── Scenario Definitions ─────────────────────────────────────────────────────
const SCENARIOS = {
  idle: {
    name: 'Idle Room',
    deviceCount: 1,
    fluctuation: 2,
    drift: 0.5,
    description: 'Empty or very quiet environment',
  },
  person_entering: {
    name: 'Person Entering',
    deviceCount: 2,
    fluctuation: 12,
    drift: 3,
    description: 'Someone entering the monitored area',
  },
  walking: {
    name: 'Walking Movement',
    deviceCount: 2,
    fluctuation: 18,
    drift: 5,
    description: 'Active walking movement detected',
  },
  multiple_people: {
    name: 'Multiple People',
    deviceCount: 4,
    fluctuation: 22,
    drift: 6,
    description: 'Multiple occupants in the area',
  },
  activity_burst: {
    name: 'Activity Burst',
    deviceCount: 3,
    fluctuation: 30,
    drift: 8,
    description: 'Sudden burst of intense activity',
  },
};

// ─── State ────────────────────────────────────────────────────────────────────
let simulatorState = {
  isRunning: false,
  isDemoMode: false,
  currentScenario: 'idle',
  devices: [],
  sessionId: uuidv4(),
  intervalId: null,
  demoIntervalId: null,
  tick: 0,
};

/**
 * Generate a realistic RSSI value with noise
 */
const generateRssi = (baseRssi, fluctuation, drift) => {
  const noise = (Math.random() - 0.5) * fluctuation;
  const driftComponent = (Math.random() - 0.5) * drift;
  const rssi = baseRssi + noise + driftComponent;
  return Math.round(Math.max(-100, Math.min(-20, rssi)));
};

/**
 * Initialize device pool for current scenario
 */
const initDevices = (scenario) => {
  const config = SCENARIOS[scenario] || SCENARIOS.idle;
  const count = config.deviceCount;
  const selected = DEVICE_TEMPLATES.slice(0, count);

  return selected.map(template => ({
    id: `dev_${template.name.replace(/\s/g, '_').toLowerCase()}`,
    name: template.name,
    type: template.type,
    baseRssi: template.baseRssi,
    rssi: template.baseRssi,
    rssiHistory: Array(10).fill(template.baseRssi).map(r =>
      r + (Math.random() - 0.5) * 4
    ),
    lastSeen: Date.now(),
    isActive: true,
  }));
};

/**
 * Update device RSSI readings
 */
const updateDevices = (devices, scenario) => {
  const config = SCENARIOS[scenario] || SCENARIOS.idle;

  return devices.map(device => {
    const newRssi = generateRssi(device.baseRssi, config.fluctuation, config.drift);
    const history = [...(device.rssiHistory || []), newRssi].slice(-20);

    return {
      ...device,
      rssi: newRssi,
      rssiHistory: history,
      lastSeen: Date.now(),
    };
  });
};

/**
 * Start the signal simulator
 */
const startSignalSimulator = (io) => {
  if (simulatorState.isRunning) return;

  simulatorState.isRunning = true;
  simulatorState.devices = initDevices('idle');

  console.log('[SignalSimulator] Starting in idle mode...');

  // Main signal update loop — 500ms interval
  simulatorState.intervalId = setInterval(() => {
    simulatorState.tick++;
    simulatorState.devices = updateDevices(
      simulatorState.devices,
      simulatorState.currentScenario
    );

    const analysis = analyzeSignals(simulatorState.devices);

    const payload = {
      timestamp: new Date().toISOString(),
      sessionId: simulatorState.sessionId,
      tick: simulatorState.tick,
      scenario: simulatorState.currentScenario,
      isDemoMode: simulatorState.isDemoMode,
      devices: simulatorState.devices.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        rssi: d.rssi,
        rssiHistory: d.rssiHistory.slice(-10),
        lastSeen: d.lastSeen,
      })),
      analysis,
    };

    io.emit('signal:update', payload);

    // Emit anomalies separately for immediate UI reaction
    if (analysis.anomalies && analysis.anomalies.length > 0) {
      analysis.anomalies.forEach(anomaly => {
        io.emit('anomaly:detected', {
          ...anomaly,
          timestamp: new Date().toISOString(),
          sessionId: simulatorState.sessionId,
          occupancyAtEvent: analysis.occupancyProbability,
        });
      });
    }
  }, 500);
};

/**
 * Stop the signal simulator
 */
const stopSignalSimulator = () => {
  if (simulatorState.intervalId) {
    clearInterval(simulatorState.intervalId);
    simulatorState.intervalId = null;
  }
  simulatorState.isRunning = false;
  console.log('[SignalSimulator] Stopped');
};

/**
 * Activate demo mode with scenario cycling
 */
const activateDemoMode = (io, scenarioName = null) => {
  simulatorState.isDemoMode = true;

  if (scenarioName && SCENARIOS[scenarioName]) {
    // Run specific scenario
    simulatorState.currentScenario = scenarioName;
    simulatorState.devices = initDevices(scenarioName);

    io.emit('demo:scenario', {
      scenario: scenarioName,
      name: SCENARIOS[scenarioName].name,
      description: SCENARIOS[scenarioName].description,
    });

    console.log(`[DemoMode] Activated scenario: ${scenarioName}`);
    return;
  }

  // Auto-cycle through all scenarios
  const scenarioKeys = Object.keys(SCENARIOS);
  let scenarioIndex = 0;

  const cycleScenario = () => {
    const key = scenarioKeys[scenarioIndex % scenarioKeys.length];
    simulatorState.currentScenario = key;
    simulatorState.devices = initDevices(key);

    io.emit('demo:scenario', {
      scenario: key,
      name: SCENARIOS[key].name,
      description: SCENARIOS[key].description,
    });

    console.log(`[DemoMode] Cycling to: ${key}`);
    scenarioIndex++;
  };

  cycleScenario();
  simulatorState.demoIntervalId = setInterval(cycleScenario, 8000);
};

/**
 * Deactivate demo mode
 */
const deactivateDemoMode = () => {
  simulatorState.isDemoMode = false;
  simulatorState.currentScenario = 'idle';
  simulatorState.devices = initDevices('idle');

  if (simulatorState.demoIntervalId) {
    clearInterval(simulatorState.demoIntervalId);
    simulatorState.demoIntervalId = null;
  }

  console.log('[DemoMode] Deactivated');
};

/**
 * Get current simulator state
 */
const getSimulatorState = () => ({
  isRunning: simulatorState.isRunning,
  isDemoMode: simulatorState.isDemoMode,
  currentScenario: simulatorState.currentScenario,
  deviceCount: simulatorState.devices.length,
  sessionId: simulatorState.sessionId,
  tick: simulatorState.tick,
  scenarios: Object.keys(SCENARIOS).map(k => ({
    key: k,
    ...SCENARIOS[k],
  })),
});

/**
 * Inject real BT scanner data into the pipeline
 */
const injectRealScanData = (io, scanData) => {
  if (!scanData || !Array.isArray(scanData)) return;

  // Merge real scan data with simulator state
  scanData.forEach(device => {
    const existing = simulatorState.devices.find(d => d.id === device.id);
    if (existing) {
      existing.rssi = device.rssi;
      existing.rssiHistory = [...(existing.rssiHistory || []), device.rssi].slice(-20);
      existing.lastSeen = Date.now();
    } else {
      simulatorState.devices.push({
        id: device.id,
        name: device.name || 'Unknown Device',
        type: 'real',
        baseRssi: device.rssi,
        rssi: device.rssi,
        rssiHistory: [device.rssi],
        lastSeen: Date.now(),
        isReal: true,
      });
    }
  });
};

module.exports = {
  startSignalSimulator,
  stopSignalSimulator,
  activateDemoMode,
  deactivateDemoMode,
  getSimulatorState,
  injectRealScanData,
  SCENARIOS,
};
