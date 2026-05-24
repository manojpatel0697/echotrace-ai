/**
 * Signal Analysis Engine Tests
 */

const {
  calculateVariance,
  calculateStdDev,
  normalizeInstability,
  estimateOccupancy,
  estimateMovementIntensity,
  classifyActivity,
  detectAnomalies,
  analyzeSignals,
} = require('../utils/signalAnalysis');

describe('Signal Analysis Engine', () => {
  describe('calculateVariance', () => {
    it('returns 0 for empty array', () => {
      expect(calculateVariance([])).toBe(0);
    });

    it('returns 0 for single value', () => {
      expect(calculateVariance([-60])).toBe(0);
    });

    it('calculates variance correctly', () => {
      const values = [-60, -60, -60, -60]; // all same = 0 variance
      expect(calculateVariance(values)).toBe(0);
    });

    it('returns positive variance for varying values', () => {
      const values = [-50, -70, -55, -65];
      expect(calculateVariance(values)).toBeGreaterThan(0);
    });
  });

  describe('normalizeInstability', () => {
    it('returns 0 for zero variance', () => {
      expect(normalizeInstability(0)).toBe(0);
    });

    it('returns 1 for max variance (200)', () => {
      expect(normalizeInstability(200)).toBe(1);
    });

    it('clamps values above 200', () => {
      expect(normalizeInstability(500)).toBe(1);
    });

    it('returns value between 0 and 1', () => {
      const result = normalizeInstability(50);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('estimateOccupancy', () => {
    it('returns 0 for empty history', () => {
      expect(estimateOccupancy([], 0)).toBe(0);
    });

    it('returns higher occupancy for more devices', () => {
      const rssi = [-60, -62, -58, -65];
      const low = estimateOccupancy(rssi, 1);
      const high = estimateOccupancy(rssi, 5);
      expect(high).toBeGreaterThan(low);
    });

    it('returns value between 0 and 100', () => {
      const rssi = [-50, -70, -45, -80, -55];
      const result = estimateOccupancy(rssi, 3);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe('estimateMovementIntensity', () => {
    it('returns 0 for empty history', () => {
      expect(estimateMovementIntensity([])).toBe(0);
    });

    it('returns 0 for single value', () => {
      expect(estimateMovementIntensity([-60])).toBe(0);
    });

    it('returns higher intensity for larger fluctuations', () => {
      const stable = [-60, -61, -60, -61];
      const unstable = [-50, -80, -45, -85];
      expect(estimateMovementIntensity(unstable)).toBeGreaterThan(
        estimateMovementIntensity(stable)
      );
    });

    it('returns value between 0 and 100', () => {
      const rssi = [-50, -90, -45, -95];
      const result = estimateMovementIntensity(rssi);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe('classifyActivity', () => {
    it('classifies 0 as idle', () => {
      expect(classifyActivity(0)).toBe('idle');
    });

    it('classifies 5 as idle', () => {
      expect(classifyActivity(5)).toBe('idle');
    });

    it('classifies 20 as low', () => {
      expect(classifyActivity(20)).toBe('low');
    });

    it('classifies 40 as moderate', () => {
      expect(classifyActivity(40)).toBe('moderate');
    });

    it('classifies 60 as high', () => {
      expect(classifyActivity(60)).toBe('high');
    });

    it('classifies 90 as intense', () => {
      expect(classifyActivity(90)).toBe('intense');
    });
  });

  describe('detectAnomalies', () => {
    it('returns empty array for insufficient data', () => {
      expect(detectAnomalies([-60], 50, 50)).toEqual([]);
    });

    it('detects RSSI spike', () => {
      const rssi = [-60, -60, -30]; // 30 dBm spike
      const anomalies = detectAnomalies(rssi, 50, 50);
      expect(anomalies.some(a => a.type === 'rssi_spike')).toBe(true);
    });

    it('detects rapid movement', () => {
      const rssi = [-60, -62, -61];
      const anomalies = detectAnomalies(rssi, 50, 85);
      expect(anomalies.some(a => a.type === 'rapid_movement')).toBe(true);
    });

    it('detects occupancy surge', () => {
      const rssi = [-60, -62, -61];
      const anomalies = detectAnomalies(rssi, 95, 50);
      expect(anomalies.some(a => a.type === 'occupancy_surge')).toBe(true);
    });
  });

  describe('analyzeSignals', () => {
    it('returns defaults for empty devices', () => {
      const result = analyzeSignals([]);
      expect(result.occupancyProbability).toBe(0);
      expect(result.movementIntensity).toBe(0);
      expect(result.activityLevel).toBe('idle');
    });

    it('returns valid analysis for device list', () => {
      const devices = [
        { id: 'dev1', rssi: -60, rssiHistory: [-60, -65, -58, -70, -55] },
        { id: 'dev2', rssi: -55, rssiHistory: [-55, -50, -60, -45, -65] },
      ];
      const result = analyzeSignals(devices);
      expect(result.occupancyProbability).toBeGreaterThanOrEqual(0);
      expect(result.occupancyProbability).toBeLessThanOrEqual(100);
      expect(result.movementIntensity).toBeGreaterThanOrEqual(0);
      expect(result.deviceCount).toBe(2);
    });

    it('returns higher occupancy for more active signals', () => {
      const stableDevices = [
        { id: 'dev1', rssi: -60, rssiHistory: [-60, -60, -60, -60, -60] },
      ];
      const activeDevices = [
        { id: 'dev1', rssi: -60, rssiHistory: [-40, -80, -35, -85, -45] },
        { id: 'dev2', rssi: -55, rssiHistory: [-30, -90, -40, -75, -50] },
      ];
      const stable = analyzeSignals(stableDevices);
      const active = analyzeSignals(activeDevices);
      expect(active.occupancyProbability).toBeGreaterThan(stable.occupancyProbability);
    });
  });
});
