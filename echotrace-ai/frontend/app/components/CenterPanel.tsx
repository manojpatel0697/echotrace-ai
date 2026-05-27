'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RadarCanvas from './RadarCanvas';
import OccupancyHeatmap from './OccupancyHeatmap';
import type { BluetoothDevice, SignalAnalysis } from '@/app/types';
import { getOccupancyColor } from '@/app/lib/utils';

interface CenterPanelProps {
  analysis?: SignalAnalysis;
  devices: BluetoothDevice[];
  isDemoMode: boolean;
  scenario?: string;
}

export default function CenterPanel({ analysis, devices, isDemoMode, scenario }: CenterPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [radarSize, setRadarSize] = useState(420);
  const [activeView, setActiveView] = useState<'radar' | 'heatmap'>('radar');

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const size = Math.min(width - 40, height - 120, 520);
        setRadarSize(Math.max(size, 300));
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const occ = analysis?.occupancyProbability ?? 0;
  const movement = analysis?.movementIntensity ?? 0;
  const activity = analysis?.activityLevel ?? 'idle';
  const occColor = getOccupancyColor(occ);

  return (
    <div ref={containerRef} className="panel flex flex-col h-full overflow-hidden">

      {/* ─── Panel Header ──────────────────────────────────────────────────── */}
      <div className="panel-header flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400"
              style={{ animation: 'blink-dot 2s ease-in-out infinite', boxShadow: '0 0 6px #00d4ff' }} />
            <span className="text-xs font-semibold text-cyan-400 font-mono tracking-wider">
              WIRELESS SENSING MAP
            </span>
          </div>
          {isDemoMode && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
              DEMO: {scenario?.replace(/_/g, ' ').toUpperCase()}
            </span>
          )}
        </div>

        {/* View toggle */}
        <div className="flex gap-1">
          {(['radar', 'heatmap'] as const).map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className="px-2 py-1 rounded text-[10px] font-mono transition-all"
              style={{
                background: activeView === view ? 'rgba(0,212,255,0.15)' : 'transparent',
                color: activeView === view ? '#00d4ff' : '#475569',
                border: `1px solid ${activeView === view ? 'rgba(0,212,255,0.3)' : 'transparent'}`,
              }}>
              {view.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main Visualization ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden relative p-4">

        {/* Background grid */}
        <div className="absolute inset-0 grid-bg opacity-30" />

        <AnimatePresence mode="wait">
          {activeView === 'radar' ? (
            <motion.div
              key="radar"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative radar-container"
            >
              <RadarCanvas
                analysis={analysis}
                isDemoMode={isDemoMode}
                width={radarSize}
                height={radarSize}
              />

              {/* Occupancy overlay label */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <div className="text-xs font-mono text-slate-500">OCCUPANCY CONFIDENCE</div>
                <motion.div
                  className="text-2xl font-bold font-mono"
                  style={{ color: occColor, textShadow: `0 0 10px ${occColor}` }}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  {occ}%
                </motion.div>
              </div>

              {/* Activity label bottom */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <ActivityBadge level={activity} movement={movement} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <OccupancyHeatmap analysis={analysis} size={radarSize} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom Status Bar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t px-4 py-2 flex items-center justify-between"
        style={{ borderColor: 'rgba(0,212,255,0.1)' }}>

        <div className="flex items-center gap-4">
          <StatusItem label="DEVICES" value={devices.length.toString()} color="#00d4ff" />
          <StatusItem label="VARIANCE" value={`${(analysis?.variance ?? 0).toFixed(1)}`} color="#7c3aed" />
          <StatusItem label="INSTABILITY" value={`${Math.round((analysis?.instability ?? 0) * 100)}%`} color="#f59e0b" />
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[10px] font-mono text-slate-600">
            SENSOR MODE: {isDemoMode ? 'SIMULATED' : 'LIVE'}
          </div>
          <div className="w-1.5 h-1.5 rounded-full"
            style={{
              background: isDemoMode ? '#7c3aed' : '#10b981',
              boxShadow: `0 0 4px ${isDemoMode ? '#7c3aed' : '#10b981'}`,
              animation: 'blink-dot 2s ease-in-out infinite',
            }} />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActivityBadge({ level, movement }: { level: string; movement: number }) {
  const colors: Record<string, string> = {
    idle: '#6b7280',
    low: '#10b981',
    moderate: '#f59e0b',
    high: '#f97316',
    intense: '#ef4444',
  };
  const color = colors[level] || '#6b7280';

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full"
      style={{
        background: `${color}22`,
        border: `1px solid ${color}44`,
      }}>
      <div className="w-1.5 h-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 4px ${color}`, animation: level !== 'idle' ? 'blink-dot 1s ease-in-out infinite' : 'none' }} />
      <span className="text-xs font-mono font-semibold" style={{ color }}>
        {level.toUpperCase()}
      </span>
      <span className="text-[10px] font-mono text-slate-500">
        {movement}%
      </span>
    </div>
  );
}

function StatusItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] font-mono text-slate-600">{label}:</span>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>{value}</span>
    </div>
  );
}
