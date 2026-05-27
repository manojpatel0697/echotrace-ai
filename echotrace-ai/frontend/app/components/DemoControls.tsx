'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Square, Zap, Users, Activity, AlertTriangle, Radio } from 'lucide-react';
import type { DemoStatus, SystemState } from '@/app/types';

interface DemoControlsProps {
  demoStatus: DemoStatus;
  systemState: SystemState | null;
  onActivate: (scenario?: string) => void;
  onDeactivate: () => void;
  onScenario: (scenario: string) => void;
  onClose: () => void;
}

const SCENARIOS = [
  {
    key: 'idle',
    name: 'Idle Room',
    description: 'Empty environment, minimal signal disturbance',
    icon: <Radio size={16} />,
    color: '#6b7280',
  },
  {
    key: 'person_entering',
    name: 'Person Entering',
    description: 'Someone entering the monitored area',
    icon: <Activity size={16} />,
    color: '#10b981',
  },
  {
    key: 'walking',
    name: 'Walking Movement',
    description: 'Active walking detected via signal fluctuation',
    icon: <Zap size={16} />,
    color: '#f59e0b',
  },
  {
    key: 'multiple_people',
    name: 'Multiple People',
    description: 'Multiple occupants — high signal disturbance',
    icon: <Users size={16} />,
    color: '#f97316',
  },
  {
    key: 'activity_burst',
    name: 'Activity Burst',
    description: 'Sudden intense movement event',
    icon: <AlertTriangle size={16} />,
    color: '#ef4444',
  },
];

export default function DemoControls({
  demoStatus,
  systemState,
  onActivate,
  onDeactivate,
  onScenario,
  onClose,
}: DemoControlsProps) {
  const [hoveredScenario, setHoveredScenario] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="absolute bottom-16 right-4 w-80 rounded-xl overflow-hidden z-50"
      style={{
        background: 'rgba(10, 22, 40, 0.97)',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 0 40px rgba(0, 212, 255, 0.1), 0 20px 60px rgba(0,0,0,0.5)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full"
            style={{
              background: demoStatus.active ? '#7c3aed' : '#475569',
              boxShadow: demoStatus.active ? '0 0 6px #7c3aed' : 'none',
              animation: demoStatus.active ? 'blink-dot 1s ease-in-out infinite' : 'none',
            }} />
          <span className="text-sm font-semibold text-cyan-400 font-mono">DEMO CONTROL</span>
        </div>
        <button onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Demo toggle */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(0,212,255,0.08)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-mono">SIMULATION MODE</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded"
            style={{
              background: demoStatus.active ? 'rgba(124,58,237,0.2)' : 'rgba(71,85,105,0.2)',
              color: demoStatus.active ? '#a78bfa' : '#64748b',
              border: `1px solid ${demoStatus.active ? 'rgba(124,58,237,0.3)' : 'rgba(71,85,105,0.3)'}`,
            }}>
            {demoStatus.active ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onActivate()}
            disabled={demoStatus.active}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-semibold transition-all"
            style={{
              background: demoStatus.active ? 'rgba(71,85,105,0.2)' : 'rgba(0,212,255,0.15)',
              border: `1px solid ${demoStatus.active ? 'rgba(71,85,105,0.3)' : 'rgba(0,212,255,0.4)'}`,
              color: demoStatus.active ? '#475569' : '#00d4ff',
              cursor: demoStatus.active ? 'not-allowed' : 'pointer',
            }}>
            <Play size={12} />
            AUTO CYCLE
          </button>
          <button
            onClick={onDeactivate}
            disabled={!demoStatus.active}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-semibold transition-all"
            style={{
              background: !demoStatus.active ? 'rgba(71,85,105,0.2)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${!demoStatus.active ? 'rgba(71,85,105,0.3)' : 'rgba(239,68,68,0.4)'}`,
              color: !demoStatus.active ? '#475569' : '#f87171',
              cursor: !demoStatus.active ? 'not-allowed' : 'pointer',
            }}>
            <Square size={12} />
            STOP
          </button>
        </div>
      </div>

      {/* Scenario selector */}
      <div className="px-4 py-3">
        <div className="text-[10px] font-mono text-slate-600 mb-2 tracking-wider">
          SELECT SCENARIO
        </div>
        <div className="space-y-1.5">
          {SCENARIOS.map(scenario => (
            <button
              key={scenario.key}
              onClick={() => onScenario(scenario.key)}
              onMouseEnter={() => setHoveredScenario(scenario.key)}
              onMouseLeave={() => setHoveredScenario(null)}
              className="w-full flex items-center gap-3 p-2.5 rounded text-left transition-all"
              style={{
                background: demoStatus.scenario === scenario.key
                  ? `${scenario.color}22`
                  : hoveredScenario === scenario.key
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.3)',
                border: `1px solid ${demoStatus.scenario === scenario.key
                  ? `${scenario.color}44`
                  : 'rgba(255,255,255,0.05)'}`,
              }}>

              <div className="flex-shrink-0" style={{ color: scenario.color }}>
                {scenario.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-200">{scenario.name}</div>
                <div className="text-[9px] text-slate-600 font-mono truncate">
                  {scenario.description}
                </div>
              </div>

              {demoStatus.scenario === scenario.key && demoStatus.active && (
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: scenario.color,
                    boxShadow: `0 0 4px ${scenario.color}`,
                    animation: 'blink-dot 1s ease-in-out infinite',
                  }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t text-center"
        style={{ borderColor: 'rgba(0,212,255,0.08)' }}>
        <p className="text-[9px] font-mono text-slate-700">
          Demo mode simulates realistic BT signal patterns
        </p>
      </div>
    </motion.div>
  );
}
