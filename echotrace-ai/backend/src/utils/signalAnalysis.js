/**
 * Signal Analysis Engine
 * Analyzes RSSI fluctuations to estimate occupancy and movement
 */

/**
 * Calculate variance of an array of numbers
 */
const calculateVariance = (values) => {
  if (!values || values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
};

/**
 * Calculate standard deviation
 */
const calculateStdDev = (values) => Math.sqrt(calculateVariance(values));

/**
 * Normalize RSSI to 0–1 instability score
 * Typical RSSI range: -100 dBm (weak) to -30 dBm (strong)
 */
const normalizeInstability = (variance) => {
  // Variance > 100 = very unstable (high movement)
  // Variance < 5   = very stable (no movement)
  const clamped = Math.min(variance, 200);
  return clamped / 200;
};

/**
 * Estimate occupancy probability from signal data
 * Returns 0–100
 */
const estimateOccupancy = (rssiHistory, deviceCount) => {
  if (!rssiHistory || rssiHistory.length === 0) return 0;

  const variance = calculateVariance(rssiHistory);
  const instability = normalizeInstability(variance);
  const deviceBonus = Math.min(deviceCount * 8, 40); // more devices = more likely occupied

  // Base occupancy from instability
  let occupancy = instability * 60 + deviceBonus;

  // Boost if recent rapid changes detected
  if (rssiHistory.length >= 3) {
    const recentChanges = rssiHistory.slice(-5);
    const maxDelta = Math.max(...recentChanges) - Math.min(...recentChanges);
    if (maxDelta > 15) occupancy += 20;
    else if (maxDelta > 8) occupancy += 10;
  }

  return Math.min(Math.round(occupancy), 100);
};

/**
 * Estimate movement intensity from signal fluctuations
 * Returns 0–100
 */
const estimateMovementIntensity = (rssiHistory) => {
  if (!rssiHistory || rssiHistory.length < 2) return 0;

  // Calculate rate of change between consecutive readings
  const deltas = [];
  for (let i = 1; i < rssiHistory.length; i++) {
    deltas.push(Math.abs(rssiHistory[i] - rssiHistory[i - 1]));
  }

  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const maxDelta = Math.max(...deltas);

  // avgDelta > 10 = significant movement
  const intensity = Math.min((avgDelta / 15) * 70 + (maxDelta / 30) * 30, 100);
  return Math.round(intensity);
};

/**
 * Classify activity level from movement intensity
 */
const classifyActivity = (movementIntensity) => {
  if (movementIntensity < 10) return 'idle';
  if (movementIntensity < 25) return 'low';
  if (movementIntensity < 50) return 'moderate';
  if (movementIntensity < 75) return 'high';
  return 'intense';
};

/**
 * Detect anomalies in signal data
 */
const detectAnomalies = (rssiHistory, occupancy, movementIntensity) => {
  const anomalies = [];

  if (!rssiHistory || rssiHistory.length < 3) return anomalies;

  const variance = calculateVariance(rssiHistory);
  const recent = rssiHistory.slice(-3);
  const maxDelta = Math.max(...recent) - Math.min(...recent);

  // Sudden RSSI spike
  if (maxDelta > 25) {
    anomalies.push({
      type: 'rssi_spike',
      severity: maxDelta > 35 ? 'high' : 'medium',
      description: `Sudden RSSI delta of ${maxDelta.toFixed(1)} dBm detected`,
    });
  }

  // Rapid movement burst
  if (movementIntensity > 80) {
    anomalies.push({
      type: 'rapid_movement',
      severity: 'high',
      description: `Extreme movement intensity: ${movementIntensity}%`,
    });
  }

  // Occupancy surge
  if (occupancy > 90) {
    anomalies.push({
      type: 'occupancy_surge',
      severity: 'medium',
      description: `High occupancy probability: ${occupancy}%`,
    });
  }

  // Signal dropout (very low RSSI suddenly)
  const lastRssi = rssiHistory[rssiHistory.length - 1];
  if (lastRssi < -90) {
    anomalies.push({
      type: 'signal_dropout',
      severity: 'low',
      description: `Weak signal detected: ${lastRssi} dBm`,
    });
  }

  return anomalies;
};

/**
 * Full signal analysis pipeline
 */
const analyzeSignals = (devices) => {
  if (!devices || devices.length === 0) {
    return {
      occupancyProbability: 0,
      movementIntensity: 0,
      activityLevel: 'idle',
      variance: 0,
      instability: 0,
      anomalies: [],
      deviceCount: 0,
    };
  }

  // Aggregate RSSI history across all devices
  const allRssi = devices.flatMap(d => d.rssiHistory || [d.rssi]);
  const variance = calculateVariance(allRssi);
  const instability = normalizeInstability(variance);
  const occupancyProbability = estimateOccupancy(allRssi, devices.length);
  const movementIntensity = estimateMovementIntensity(allRssi);
  const activityLevel = classifyActivity(movementIntensity);
  const anomalies = detectAnomalies(allRssi, occupancyProbability, movementIntensity);

  return {
    occupancyProbability,
    movementIntensity,
    activityLevel,
    variance: Math.round(variance * 100) / 100,
    instability: Math.round(instability * 100) / 100,
    anomalies,
    deviceCount: devices.length,
    avgRssi: Math.round(allRssi.reduce((a, b) => a + b, 0) / allRssi.length),
  };
};

module.exports = {
  calculateVariance,
  calculateStdDev,
  normalizeInstability,
  estimateOccupancy,
  estimateMovementIntensity,
  classifyActivity,
  detectAnomalies,
  analyzeSignals,
};
