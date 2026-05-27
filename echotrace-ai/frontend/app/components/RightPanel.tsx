'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle } from 'lucide-react';
import type { AgentMessage, AnomalyEvent, SignalAnalysis } from '@/app/types';
import { formatTime, getSeverityColor } from '@/app/lib/utils';

// Fixed bar heights — avoids Math.random() in render path causing re-renders
const BAR_HEIGHTS = [8, 16, 12, 18];

interface RightPanelProps {
  agentMessages: AgentMessage[];
  anomalies: AnomalyEvent[];
  analysis?: SignalAnalysis;
}

export default function RightPanel({ agentMessages, anomalies, analysis }: RightPanelProps) {
  return (
    <div className="flex flex-col h-full gap-2">
      <AIThinkingHeader analysis={analysis} />

      {/* ─── Agent Feed ──────────────────────────────────────────────────── */}
      <div className="panel flex flex-col flex-1 overflow-hidden">
        <div className="panel-header flex items-center gap-2">
          <Brain size={12} className="text-purple-400" />
          <span className="text-xs font-semibold text-purple-400 font-mono">AI AGENT FEED</span>
          <span className="ml-auto text-[10px] font-mono text-slate-600">
            {agentMessages.length} msgs
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <AnimatePresence initial={false}>
            {agentMessages.length === 0 ? (
              <div className="text-center py-6 text-slate-600 text-xs font-mono">
                <div className="flex justify-center gap-1 mb-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-700"
                      style={{ animation: `blink-dot 1.2s ease-in-out ${i * 0.4}s infinite` }} />
                  ))}
                </div>
                Agents initializing...
              </div>
            ) : (
              agentMessages.map(msg => (
                <AgentMessageCard key={msg.id} message={msg} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Anomaly Alerts ──────────────────────────────────────────────── */}
      <div className="panel flex flex-col" style={{ maxHeight: '35%' }}>
        <div className="panel-header flex items-center gap-2">
          <AlertTriangle size={12} className="text-amber-400" />
          <span className="text-xs font-semibold text-amber-400 font-mono">ANOMALY ALERTS</span>
          {anomalies.length > 0 && (
            <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
              {anomalies.length}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          <AnimatePresence initial={false}>
            {anomalies.length === 0 ? (
              <div className="text-center py-3 text-slate-600 text-xs font-mono">
                No anomalies detected
              </div>
            ) : (
              anomalies.slice(0, 8).map((anomaly, i) => (
                <AnomalyCard key={`${anomaly.type}-${i}`} anomaly={anomaly} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── AI Thinking Header ───────────────────────────────────────────────────────

function AIThinkingHeader({ analysis }: { analysis?: SignalAnalysis }) {
  const isActive = (analysis?.movementIntensity ?? 0) > 10 || (analysis?.occupancyProbability ?? 0) > 20;

  return (
    <div className="panel p-3 flex-shrink-0">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative w-6 h-6">
          <div className="absolute inset-0 rounded-full border border-purple-500/40"
            style={{ animation: isActive ? 'pulse-ring 2s ease-out infinite' : 'none' }} />
          <div className="absolute inset-1 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.2)' }}>
            <Brain size={10} className="text-purple-400" />
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-purple-400 font-mono">AI REASONING ENGINE</div>
          <div className="text-[9px] text-slate-600 font-mono">
            {isActive ? 'ANALYZING SIGNAL PATTERNS...' : 'MONITORING ENVIRONMENT'}
          </div>
        </div>
        {isActive && (
          <div className="ml-auto flex gap-0.5 items-end">
            {BAR_HEIGHTS.map((h, i) => (
              <div key={i}
                className="w-0.5 rounded-full bg-purple-500"
                style={{
                  height: `${h}px`,
                  animation: `blink-dot ${0.4 + i * 0.1}s ease-in-out infinite`,
                }} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <ConfidenceRow label="OCCUPANCY"    value={analysis?.occupancyProbability ?? 0} color="#00d4ff" />
        <ConfidenceRow label="MOVEMENT"     value={analysis?.movementIntensity ?? 0}    color="#7c3aed" />
        <ConfidenceRow label="ANOMALY RISK" value={Math.min((analysis?.anomalies?.length ?? 0) * 25, 100)} color="#ef4444" />
      </div>
    </div>
  );
}

function ConfidenceRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-slate-600 w-20">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="text-[9px] font-mono w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

// ─── Agent Message Card ───────────────────────────────────────────────────────

function AgentMessageCard({ message }: { message: AgentMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded p-2.5"
      style={{
        background: 'rgba(0,0,0,0.4)',
        border: `1px solid ${message.agentColor}22`,
        borderLeft: `2px solid ${message.agentColor}`,
      }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm">{message.agentIcon}</span>
        <span className="text-[10px] font-semibold font-mono" style={{ color: message.agentColor }}>
          {message.agentName}
        </span>
        <span className="ml-auto text-[9px] font-mono text-slate-600">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <p className="text-[10px] text-slate-300 leading-relaxed font-mono">{message.message}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <div className="flex-1 h-0.5 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full"
            style={{ width: `${message.confidence}%`, background: message.agentColor }} />
        </div>
        <span className="text-[9px] font-mono text-slate-600">{message.confidence}% conf</span>
      </div>
    </motion.div>
  );
}

// ─── Anomaly Card ─────────────────────────────────────────────────────────────

function AnomalyCard({ anomaly }: { anomaly: AnomalyEvent }) {
  const color = getSeverityColor(anomaly.severity);
  const icons: Record<string, string> = {
    rssi_spike: '⚡', rapid_movement: '🏃', occupancy_surge: '👥',
    signal_dropout: '📡', pattern_anomaly: '🔍',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-2 p-2 rounded"
      style={{ background: `${color}11`, border: `1px solid ${color}33` }}>
      <span className="text-xs mt-0.5">{icons[anomaly.type] || '⚠'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-[9px] font-mono font-bold uppercase" style={{ color }}>
            {anomaly.severity}
          </span>
          <span className="text-[9px] font-mono text-slate-600">
            {anomaly.type.replace(/_/g, ' ')}
          </span>
        </div>
        <p className="text-[9px] text-slate-400 font-mono leading-relaxed">{anomaly.description}</p>
      </div>
    </motion.div>
  );
}
