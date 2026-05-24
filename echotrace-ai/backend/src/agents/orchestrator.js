/**
 * Multi-Agent Orchestrator
 * Coordinates Signal, Presence, Activity, Safety, and Analytics agents
 */

const { interpretSignalData } = require('../services/geminiService');

// Agent definitions
const AGENTS = {
  signal: {
    id: 'signal',
    name: 'Signal Agent',
    icon: '📡',
    color: '#00d4ff',
    description: 'Monitors RSSI behavior and signal quality',
    intervalMs: 15000,
  },
  presence: {
    id: 'presence',
    name: 'Presence Agent',
    icon: '👁',
    color: '#7c3aed',
    description: 'Estimates occupancy probability',
    intervalMs: 18000,
  },
  activity: {
    id: 'activity',
    name: 'Activity Agent',
    icon: '⚡',
    color: '#f59e0b',
    description: 'Estimates movement intensity',
    intervalMs: 20000,
  },
  safety: {
    id: 'safety',
    name: 'Safety Agent',
    icon: '🛡',
    color: '#ef4444',
    description: 'Detects anomalies and unusual patterns',
    intervalMs: 25000,
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics Agent',
    icon: '📊',
    color: '#10b981',
    description: 'Summarizes wireless sensing trends',
    intervalMs: 30000,
  },
};

let orchestratorState = {
  isRunning: false,
  intervals: {},
  lastSignalData: null,
  messageHistory: [],
};

/**
 * Run a single agent analysis cycle
 */
const runAgent = async (agentId, io) => {
  const agent = AGENTS[agentId];
  if (!agent || !orchestratorState.lastSignalData) return;

  try {
    const signalData = orchestratorState.lastSignalData;
    const result = await interpretSignalData(signalData, agentId);

    const message = {
      id: `msg_${Date.now()}_${agentId}`,
      timestamp: new Date().toISOString(),
      agentId,
      agentName: agent.name,
      agentIcon: agent.icon,
      agentColor: agent.color,
      message: result.message,
      confidence: result.confidence,
      source: result.source,
      occupancyEstimate: signalData.occupancyProbability,
      movementEstimate: signalData.movementIntensity,
    };

    // Store in history (keep last 50)
    orchestratorState.messageHistory = [
      message,
      ...orchestratorState.messageHistory,
    ].slice(0, 50);

    io.emit('agent:message', message);

    // Safety agent anomaly alert
    if (agentId === 'safety' && signalData.anomalies?.length > 0) {
      io.emit('agent:alert', {
        ...message,
        anomalies: signalData.anomalies,
        severity: signalData.anomalies[0]?.severity || 'medium',
      });
    }
  } catch (err) {
    console.error(`[Agent:${agentId}] Error:`, err.message);
  }
};

/**
 * Initialize the multi-agent orchestrator
 */
const initAgentOrchestrator = (io) => {
  if (orchestratorState.isRunning) return;
  orchestratorState.isRunning = true;

  // Start each agent on its own staggered interval
  Object.values(AGENTS).forEach((agent, index) => {
    const staggerMs = index * 2000;
    setTimeout(() => {
      orchestratorState.intervals[agent.id] = setInterval(
        () => runAgent(agent.id, io),
        agent.intervalMs
      );
      console.log(`[Orchestrator] Agent started: ${agent.name}`);
    }, staggerMs);
  });

  // Seed with default data so agents have something to work with immediately
  orchestratorState.lastSignalData = {
    occupancyProbability: 0,
    movementIntensity: 0,
    activityLevel: 'idle',
    variance: 0,
    instability: 0,
    anomalies: [],
    deviceCount: 0,
    avgRssi: -70,
  };

  console.log(`[Orchestrator] Multi-agent system initialized with ${Object.keys(AGENTS).length} agents`);
};

/**
 * Feed live signal data to agents (called by signal update loop)
 */
const feedSignalData = (data) => {
  if (data?.analysis) {
    orchestratorState.lastSignalData = data.analysis;
  }
};

/**
 * Get recent agent message history
 */
const getMessageHistory = (limit = 20) =>
  orchestratorState.messageHistory.slice(0, limit);

/**
 * Get all agent definitions
 */
const getAgents = () => Object.values(AGENTS);

module.exports = {
  initAgentOrchestrator,
  feedSignalData,
  getMessageHistory,
  getAgents,
  AGENTS,
};
