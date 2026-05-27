/**
 * EchoTrace AI — TypeScript Type Definitions
 */

// ─── Signal Types ─────────────────────────────────────────────────────────────

export interface BluetoothDevice {
  id: string;
  name: string;
  type: 'phone' | 'laptop' | 'earbuds' | 'wearable' | 'real' | 'unknown';
  rssi: number;
  rssiHistory: number[];
  lastSeen: number;
  isActive?: boolean;
  isReal?: boolean;
}

export interface SignalAnalysis {
  occupancyProbability: number;   // 0–100
  movementIntensity: number;      // 0–100
  activityLevel: ActivityLevel;
  variance: number;
  instability: number;            // 0–1
  anomalies: AnomalyEvent[];
  deviceCount: number;
  avgRssi?: number;
}

export type ActivityLevel = 'idle' | 'low' | 'moderate' | 'high' | 'intense';

export interface SignalUpdate {
  timestamp: string;
  sessionId: string;
  tick: number;
  scenario: string;
  isDemoMode: boolean;
  devices: BluetoothDevice[];
  analysis: SignalAnalysis;
}

// ─── Anomaly Types ────────────────────────────────────────────────────────────

export interface AnomalyEvent {
  type: 'rssi_spike' | 'rapid_movement' | 'occupancy_surge' | 'signal_dropout' | 'pattern_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp?: string;
  sessionId?: string;
  occupancyAtEvent?: number;
}

// ─── AI Agent Types ───────────────────────────────────────────────────────────

export type AgentType = 'signal' | 'presence' | 'activity' | 'safety' | 'analytics';

export interface AgentMessage {
  id: string;
  timestamp: string;
  agentId: AgentType;
  agentName: string;
  agentIcon: string;
  agentColor: string;
  message: string;
  confidence: number;
  source: 'gemini' | 'fallback';
  occupancyEstimate: number;
  movementEstimate: number;
}

export interface AgentDefinition {
  id: AgentType;
  name: string;
  icon: string;
  color: string;
  description: string;
}

// ─── Demo Types ───────────────────────────────────────────────────────────────

export interface DemoScenario {
  key: string;
  name: string;
  description: string;
  deviceCount: number;
  fluctuation: number;
  drift: number;
}

export interface DemoStatus {
  active: boolean;
  scenario?: string;
}

// ─── System Types ─────────────────────────────────────────────────────────────

export interface SystemState {
  status: string;
  simulator: SimulatorState;
  timestamp: string;
}

export interface SimulatorState {
  isRunning: boolean;
  isDemoMode: boolean;
  currentScenario: string;
  deviceCount: number;
  sessionId: string;
  tick: number;
  scenarios: DemoScenario[];
}

// ─── Radar Types ──────────────────────────────────────────────────────────────

export interface RadarPoint {
  x: number;
  y: number;
  intensity: number;
  radius: number;
  age: number;
}

export interface OccupancyZone {
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string;
}

// ─── Chart Types ──────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

// ─── Connection Types ─────────────────────────────────────────────────────────

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
