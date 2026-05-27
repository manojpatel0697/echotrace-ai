'use client';

import { motion } from 'framer-motion';
import { Wifi, WifiOff, Activity, Users, Brain, Zap, Radio } from 'lucide-react';
import type { SignalAnalysis, ConnectionStatus } from '@/app/types';
import { getOccupancyColor } from '@/app/lib/utils';

interface TopBarProps {
  connectionStatus: ConnectionStatus;
  analysis?: SignalAnalysis;
  deviceCount: number;
  isDemoMode: boolean;
  currentScenario?: string;
  latency: number;
  onToggleDemo: () => void;
}

export default function TopBar({
  connectionStatus,
  analysis,
  deviceCount,
  isDemoMode,
  currentScenario,
  latency,
  onToggleDemo,
}: TopBarProps) {
  const occupancy = analysis?.occupancyProbability ?? 0;
  const movement = analysis?.movementIntensity ?? 0;
  const aiConfidence = Math.min(50 + deviceCount * 5 + (occupancy > 30 ? 20 : 0), 98);

  const connectionColor = {
    connected: '#10b981',
    connecting: '#f59e0b',
    disconnected: '#ef4444',
    error: '#ef4444',
  }[connectionStatus];

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b"
      style={{
        background: 'rgba(10, 22, 40, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.15)',
        backdropFilter: 'blur(10px)',
      }}>

      {/* ─── Logo ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-full border border-cyan-500/50 flex items-center justify-center"
            style={{ background: 'rgba(0, 212, 255, 0.1)' }}>
            <Radio size={16} className="text-cyan-400" />
          </div>
          {connectionStatus === 'connected' && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500"
              style={{ boxShadow: '0 0 6px #10b981', animation: 'blink-dot 2s ease-in-out infinite' }} />
          )}
        </div>
        <div>
          <h1 className="text-sm font-bold text-cyan-400 text-glow-cyan leading-none">
            EchoTrace AI
          </h1>
          <p className="text-xs text-slate-500 font-mono leading-none mt-0.5">
            Wireless Sensing Platform v1.0
          </p>
        </div>
      </div>

      {/* ─── Status Metrics ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">

        {/* Connection */}
        <MetricBadge
          icon={connectionStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
          label="LINK"
          value={connectionStatus.toUpperCase()}
          color={connectionColor}
        />

        {/* Occupancy */}
        <MetricBadge
          icon={<Users size={12} />}
          label="OCCUPANCY"
          value={`${occupancy}%`}
          color={getOccupancyColor(occupancy)}
          showBar
          barValue={occupancy}
        />

        {/* Movement */}
        <MetricBadge
          icon={<Activity size={12} />}
          label="MOVEMENT"
          value={`${movement}%`}
          color={movement > 50 ? '#f97316' : movement > 20 ? '#f59e0b' : '#10b981'}
          showBar
          barValue={movement}
        />

        {/* AI Confidence */}
        <MetricBadge
          icon={<Brain size={12} />}
          label="AI CONF"
          value={`${aiConfidence}%`}
          color="#7c3aed"
          showBar
          barValue={aiConfidence}
        />

        {/* Devices */}
        <MetricBadge
          icon={<Zap size={12} />}
          label="DEVICES"
          value={deviceCount.toString()}
          color="#00d4ff"
        />

        {/* Latency */}
        {latency > 0 && (
          <div className="text-xs font-mono text-slate-500">
            {latency}ms
          </div>
        )}
      </div>

      {/* ─── Demo Mode Button ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {isDemoMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono"
            style={{
              background: 'rgba(124, 58, 237, 0.2)',
              border: '1px solid rgba(124, 58, 237, 0.4)',
              color: '#a78bfa',
            }}>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400"
              style={{ animation: 'blink-dot 1s ease-in-out infinite' }} />
            DEMO: {currentScenario?.replace('_', ' ').toUpperCase()}
          </motion.div>
        )}

        <button
          onClick={onToggleDemo}
          className="px-3 py-1.5 rounded text-xs font-semibold transition-all duration-200"
          style={{
            background: isDemoMode
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(0, 212, 255, 0.15)',
            border: `1px solid ${isDemoMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 212, 255, 0.4)'}`,
            color: isDemoMode ? '#f87171' : '#00d4ff',
          }}>
          {isDemoMode ? '⏹ DEMO' : '▶ DEMO'}
        </button>
      </div>
    </div>
  );
}

// ─── Metric Badge Component ───────────────────────────────────────────────────

interface MetricBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  showBar?: boolean;
  barValue?: number;
}

function MetricBadge({ icon, label, value, color, showBar, barValue }: MetricBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
      <div className="flex items-center gap-1" style={{ color }}>
        {icon}
        <span className="text-xs font-mono font-bold">{value}</span>
      </div>
      <span className="text-[9px] text-slate-600 font-mono tracking-wider">{label}</span>
      {showBar && barValue !== undefined && (
        <div className="w-full h-0.5 rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${barValue}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </div>
  );
}
