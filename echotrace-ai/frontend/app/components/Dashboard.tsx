'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/app/hooks/useSocket';
import TopBar from './TopBar';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';
import DemoControls from './DemoControls';

export default function Dashboard() {
  const {
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
  } = useSocket();

  const [showDemoPanel, setShowDemoPanel] = useState(false);

  // Auto-show demo panel on first load
  useEffect(() => {
    const timer = setTimeout(() => setShowDemoPanel(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const analysis = signalUpdate?.analysis;
  const devices = signalUpdate?.devices || [];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden grid-bg"
      style={{ background: 'var(--bg-primary)' }}>

      {/* ─── Top Bar ─────────────────────────────────────────────────────── */}
      <TopBar
        connectionStatus={connectionStatus}
        analysis={analysis}
        deviceCount={devices.length}
        isDemoMode={demoStatus.active}
        currentScenario={signalUpdate?.scenario}
        latency={latency}
        onToggleDemo={() => setShowDemoPanel(p => !p)}
      />

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden gap-2 p-2">
        {/* Left Panel — Signal Analytics */}
        <motion.div
          className="w-72 flex-shrink-0"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LeftPanel
            devices={devices}
            analysis={analysis}
            signalUpdate={signalUpdate}
          />
        </motion.div>

        {/* Center Panel — Radar */}
        <motion.div
          className="flex-1 min-w-0"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CenterPanel
            analysis={analysis}
            devices={devices}
            isDemoMode={demoStatus.active}
            scenario={signalUpdate?.scenario}
          />
        </motion.div>

        {/* Right Panel — AI Feed */}
        <motion.div
          className="w-80 flex-shrink-0"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <RightPanel
            agentMessages={agentMessages}
            anomalies={anomalies}
            analysis={analysis}
          />
        </motion.div>
      </div>

      {/* ─── Demo Controls Overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {showDemoPanel && (
          <DemoControls
            demoStatus={demoStatus}
            systemState={systemState}
            onActivate={activateDemo}
            onDeactivate={deactivateDemo}
            onScenario={setDemoScenario}
            onClose={() => setShowDemoPanel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
