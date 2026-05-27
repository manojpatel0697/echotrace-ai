/**
 * Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      React.createElement('div', props, children),
    button: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) =>
      React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

// Mock canvas
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 50 })),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  set shadowColor(_: string) {},
  set shadowBlur(_: number) {},
  set font(_: string) {},
  set lineWidth(_: number) {},
  set strokeStyle(_: string) {},
  set fillStyle(_: string) {},
})) as jest.Mock;

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => { cb(0); return 0; });
global.cancelAnimationFrame = jest.fn();

// Mock chart.js
jest.mock('chart.js', () => ({
  Chart: jest.fn(),
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Filler: jest.fn(),
  Tooltip: jest.fn(),
  register: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Line: () => React.createElement('canvas', { 'data-testid': 'line-chart' }),
}));

// ─── TopBar Tests ─────────────────────────────────────────────────────────────

import TopBar from '@/app/components/TopBar';

describe('TopBar', () => {
  const defaultProps = {
    connectionStatus: 'connected' as const,
    analysis: {
      occupancyProbability: 65,
      movementIntensity: 40,
      activityLevel: 'moderate' as const,
      variance: 25,
      instability: 0.5,
      anomalies: [],
      deviceCount: 3,
      avgRssi: -60,
    },
    deviceCount: 3,
    isDemoMode: false,
    currentScenario: 'idle',
    latency: 12,
    onToggleDemo: jest.fn(),
  };

  it('renders without crashing', () => {
    render(React.createElement(TopBar, defaultProps));
    expect(screen.getByText('EchoTrace AI')).toBeInTheDocument();
  });

  it('shows DEMO badge when demo mode is active', () => {
    render(React.createElement(TopBar, { ...defaultProps, isDemoMode: true }));
    const demoElements = screen.getAllByText(/DEMO/);
    expect(demoElements.length).toBeGreaterThan(0);
  });

  it('shows connection status', () => {
    render(React.createElement(TopBar, defaultProps));
    expect(screen.getByText('CONNECTED')).toBeInTheDocument();
  });

  it('shows device count', () => {
    render(React.createElement(TopBar, defaultProps));
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows occupancy percentage', () => {
    render(React.createElement(TopBar, defaultProps));
    expect(screen.getByText('65%')).toBeInTheDocument();
  });
});

// ─── DemoControls Tests ───────────────────────────────────────────────────────

import DemoControls from '@/app/components/DemoControls';

describe('DemoControls', () => {
  const defaultProps = {
    demoStatus: { active: false },
    systemState: null,
    onActivate: jest.fn(),
    onDeactivate: jest.fn(),
    onScenario: jest.fn(),
    onClose: jest.fn(),
  };

  it('renders without crashing', () => {
    render(React.createElement(DemoControls, defaultProps));
    expect(screen.getByText('DEMO CONTROL')).toBeInTheDocument();
  });

  it('shows all scenario options', () => {
    render(React.createElement(DemoControls, defaultProps));
    expect(screen.getByText('Idle Room')).toBeInTheDocument();
    expect(screen.getByText('Walking Movement')).toBeInTheDocument();
    expect(screen.getByText('Multiple People')).toBeInTheDocument();
    expect(screen.getByText('Activity Burst')).toBeInTheDocument();
  });

  it('shows INACTIVE status when demo is off', () => {
    render(React.createElement(DemoControls, defaultProps));
    expect(screen.getByText('INACTIVE')).toBeInTheDocument();
  });

  it('shows ACTIVE status when demo is on', () => {
    render(React.createElement(DemoControls, {
      ...defaultProps,
      demoStatus: { active: true, scenario: 'walking' },
    }));
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });
});
