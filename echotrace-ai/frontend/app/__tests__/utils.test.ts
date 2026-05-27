/**
 * Frontend Utility Tests
 */

import {
  formatRssi,
  getSignalStrength,
  getOccupancyColor,
  getActivityColor,
  getRssiColor,
  formatTime,
  clamp,
  lerp,
  getSeverityColor,
} from '@/app/lib/utils';

describe('formatRssi', () => {
  it('formats RSSI with dBm unit', () => {
    expect(formatRssi(-60)).toBe('-60 dBm');
    expect(formatRssi(-100)).toBe('-100 dBm');
  });
});

describe('getSignalStrength', () => {
  it('returns Excellent for strong signal', () => {
    expect(getSignalStrength(-45)).toBe('Excellent');
    expect(getSignalStrength(-50)).toBe('Excellent');
  });

  it('returns Good for decent signal', () => {
    expect(getSignalStrength(-55)).toBe('Good');
    expect(getSignalStrength(-60)).toBe('Good');
  });

  it('returns Fair for moderate signal', () => {
    expect(getSignalStrength(-65)).toBe('Fair');
    expect(getSignalStrength(-70)).toBe('Fair');
  });

  it('returns Weak for poor signal', () => {
    expect(getSignalStrength(-75)).toBe('Weak');
    expect(getSignalStrength(-80)).toBe('Weak');
  });

  it('returns Very Weak for very poor signal', () => {
    expect(getSignalStrength(-85)).toBe('Very Weak');
    expect(getSignalStrength(-100)).toBe('Very Weak');
  });
});

describe('getOccupancyColor', () => {
  it('returns green for low occupancy', () => {
    expect(getOccupancyColor(0)).toBe('#10b981');
    expect(getOccupancyColor(15)).toBe('#10b981');
  });

  it('returns yellow for medium occupancy', () => {
    expect(getOccupancyColor(30)).toBe('#f59e0b');
    expect(getOccupancyColor(49)).toBe('#f59e0b');
  });

  it('returns orange for high occupancy', () => {
    expect(getOccupancyColor(60)).toBe('#f97316');
    expect(getOccupancyColor(74)).toBe('#f97316');
  });

  it('returns red for very high occupancy', () => {
    expect(getOccupancyColor(80)).toBe('#ef4444');
    expect(getOccupancyColor(100)).toBe('#ef4444');
  });
});

describe('getActivityColor', () => {
  it('returns correct colors for each activity level', () => {
    expect(getActivityColor('idle')).toBe('#6b7280');
    expect(getActivityColor('low')).toBe('#10b981');
    expect(getActivityColor('moderate')).toBe('#f59e0b');
    expect(getActivityColor('high')).toBe('#f97316');
    expect(getActivityColor('intense')).toBe('#ef4444');
  });

  it('returns default color for unknown level', () => {
    expect(getActivityColor('unknown')).toBe('#6b7280');
  });
});

describe('getRssiColor', () => {
  it('returns green for strong RSSI', () => {
    expect(getRssiColor(-45)).toBe('#10b981');
  });

  it('returns yellow for moderate RSSI', () => {
    expect(getRssiColor(-60)).toBe('#f59e0b');
  });

  it('returns orange for weak RSSI', () => {
    expect(getRssiColor(-75)).toBe('#f97316');
  });

  it('returns red for very weak RSSI', () => {
    expect(getRssiColor(-90)).toBe('#ef4444');
  });
});

describe('formatTime', () => {
  it('formats ISO timestamp to HH:MM:SS', () => {
    const result = formatTime('2024-01-15T14:30:45.000Z');
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});

describe('clamp', () => {
  it('clamps value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('handles edge values', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('lerp', () => {
  it('interpolates between two values', () => {
    expect(lerp(0, 100, 0)).toBe(0);
    expect(lerp(0, 100, 1)).toBe(100);
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it('works with negative values', () => {
    expect(lerp(-100, 100, 0.5)).toBe(0);
  });
});

describe('getSeverityColor', () => {
  it('returns correct colors for severity levels', () => {
    expect(getSeverityColor('low')).toBe('#10b981');
    expect(getSeverityColor('medium')).toBe('#f59e0b');
    expect(getSeverityColor('high')).toBe('#f97316');
    expect(getSeverityColor('critical')).toBe('#ef4444');
  });

  it('returns default for unknown severity', () => {
    expect(getSeverityColor('unknown')).toBe('#6b7280');
  });
});
