/**
 * useSocket Hook — manages Socket.IO connection and events
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@/app/lib/socket';
import type {
  SignalUpdate,
  AgentMessage,
  AnomalyEvent,
  DemoStatus,
  ConnectionStatus,
  SystemState,
} from '@/app/types';

interface UseSocketReturn {
  connectionStatus: ConnectionStatus;
  signalUpdate: SignalUpdate | null;
  agentMessages: AgentMessage[];
  anomalies: AnomalyEvent[];
  demoStatus: DemoStatus;
  systemState: SystemState | null;
  activateDemo: (scenario?: string) => void;
  deactivateDemo: () => void;
  setDemoScenario: (scenario: string) => void;
  latency: number;
}

export const useSocket = (): UseSocketReturn => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [signalUpdate, setSignalUpdate] = useState<SignalUpdate | null>(null);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [demoStatus, setDemoStatus] = useState<DemoStatus>({ active: false });
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [latency, setLatency] = useState(0);

  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingTimeRef = useRef<number>(0);

  useEffect(() => {
    const socket = getSocket();

    // ─── Connection Events ──────────────────────────────────────────────────
    socket.on('connect', () => {
      setConnectionStatus('connected');
      socket.emit('state:request');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('error');
    });

    // ─── Signal Events ──────────────────────────────────────────────────────
    socket.on('signal:update', (data: SignalUpdate) => {
      setSignalUpdate(data);
    });

    // ─── Agent Events ────────────────────────────────────────────────────────
    socket.on('agent:message', (msg: AgentMessage) => {
      setAgentMessages(prev => [msg, ...prev].slice(0, 50));
    });

    socket.on('agent:alert', (msg: AgentMessage) => {
      setAgentMessages(prev => [{ ...msg, isAlert: true } as AgentMessage, ...prev].slice(0, 50));
    });

    // ─── Anomaly Events ──────────────────────────────────────────────────────
    socket.on('anomaly:detected', (anomaly: AnomalyEvent) => {
      setAnomalies(prev => [anomaly, ...prev].slice(0, 20));
    });

    // ─── Demo Events ─────────────────────────────────────────────────────────
    socket.on('demo:status', (status: DemoStatus) => {
      setDemoStatus(status);
    });

    socket.on('demo:scenario', (data: { scenario: string; name: string; description: string }) => {
      setDemoStatus(prev => ({ ...prev, active: true, scenario: data.scenario }));
    });

    // ─── System Events ───────────────────────────────────────────────────────
    socket.on('system:state', (state: SystemState) => {
      setSystemState(state);
      if (state.simulator?.isDemoMode) {
        setDemoStatus({ active: true, scenario: state.simulator.currentScenario });
      }
    });

    // ─── Latency Measurement ─────────────────────────────────────────────────
    socket.on('pong:server', (data: { clientTime: number }) => {
      const rtt = Date.now() - data.clientTime;
      setLatency(rtt);
    });

    pingIntervalRef.current = setInterval(() => {
      if (socket.connected) {
        pingTimeRef.current = Date.now();
        socket.emit('ping:client', { clientTime: pingTimeRef.current });
      }
    }, 5000);

    // ─── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('signal:update');
      socket.off('agent:message');
      socket.off('agent:alert');
      socket.off('anomaly:detected');
      socket.off('demo:status');
      socket.off('demo:scenario');
      socket.off('system:state');
      socket.off('pong:server');
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, []);

  const activateDemo = useCallback((scenario?: string) => {
    const socket = getSocket();
    socket.emit('demo:activate', { scenario });
  }, []);

  const deactivateDemo = useCallback(() => {
    const socket = getSocket();
    socket.emit('demo:deactivate');
  }, []);

  const setDemoScenario = useCallback((scenario: string) => {
    const socket = getSocket();
    socket.emit('demo:scenario', { scenario });
  }, []);

  return {
    connectionStatus,
    signalUpdate,
    agentMessages,
    anomalies,
    demoStatus,
    systemState,
    activateDemo,
    deactivateDemo,
    setDemoScenario,
    latency,
  };
};
