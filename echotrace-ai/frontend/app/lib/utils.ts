/**
 * EchoTrace AI — Utility Functions
 */

/**
 * Format RSSI value with unit
 */
export const formatRssi = (rssi: number): string => `${rssi} dBm`;

/**
 * Get signal strength label from RSSI
 */
export const getSignalStrength = (rssi: number): string => {
  if (rssi >= -50) return 'Excellent';
  if (rssi >= -60) return 'Good';
  if (rssi >= -70) return 'Fair';
  if (rssi >= -80) return 'Weak';
  return 'Very Weak';
};

/**
 * Get color for occupancy probability (0–100)
 */
export const getOccupancyColor = (probability: number): string => {
  if (probability < 20) return '#10b981';
  if (probability < 50) return '#f59e0b';
  if (probability < 75) return '#f97316';
  return '#ef4444';
};

/**
 * Get color for activity level
 */
export const getActivityColor = (level: string): string => {
  const colors: Record<string, string> = {
    idle:     '#6b7280',
    low:      '#10b981',
    moderate: '#f59e0b',
    high:     '#f97316',
    intense:  '#ef4444',
  };
  return colors[level] ?? '#6b7280';
};

/**
 * Get color for RSSI signal strength
 */
export const getRssiColor = (rssi: number): string => {
  if (rssi >= -50) return '#10b981';
  if (rssi >= -65) return '#f59e0b';
  if (rssi >= -80) return '#f97316';
  return '#ef4444';
};

/**
 * Format ISO timestamp to HH:MM:SS
 */
export const formatTime = (timestamp: string): string =>
  new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

/**
 * Clamp a number between min and max
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Linear interpolation
 */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/**
 * Get color for anomaly severity level
 */
export const getSeverityColor = (severity: string): string => {
  const colors: Record<string, string> = {
    low:      '#10b981',
    medium:   '#f59e0b',
    high:     '#f97316',
    critical: '#ef4444',
  };
  return colors[severity] ?? '#6b7280';
};
