'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Bluetooth, Signal, TrendingUp, Activity } from 'lucide-react';
import type { BluetoothDevice, SignalAnalysis, SignalUpdate } from '@/app/types';
import { formatRssi, getSignalStrength, getRssiColor } from '@/app/lib/utils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface LeftPanelProps {
  devices: BluetoothDevice[];
  analysis?: SignalAnalysis;
  signalUpdate?: SignalUpdate | null;
}

export default function LeftPanel({ devices, analysis, signalUpdate }: LeftPanelProps) {
  const [rssiHistory, setRssiHistory] = useState<number[]>(Array(20).fill(-70));
  const [varianceHistory, setVarianceHistory] = useState<number[]>(Array(20).fill(0));

  useEffect(() => {
    if (analysis) {
      setRssiHistory(prev => [...prev.slice(-19), analysis.avgRssi ?? -70]);
      setVarianceHistory(prev => [...prev.slice(-19), analysis.variance]);
    }
  }, [analysis]);

  const labels = Array(20).fill('');

  const rssiChartData = {
    labels,
    datasets: [{
      data: rssiHistory,
      borderColor: '#00d4ff',
      backgroundColor: 'rgba(0, 212, 255, 0.05)',
      borderWidth: 1.5,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    }],
  };

  const varianceChartData = {
    labels,
    datasets: [{
      data: varianceHistory,
      borderColor: '#7c3aed',
      backgroundColor: 'rgba(124, 58, 237, 0.05)',
      borderWidth: 1.5,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    scales: {
      x: { display: false },
      y: {
        display: true,
        grid: { color: 'rgba(0, 212, 255, 0.05)' },
        ticks: { color: '#475569', font: { size: 9 }, maxTicksLimit: 4 },
      },
    },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  return (
    <div className="flex flex-col h-full gap-2">

      {/* ─── RSSI Chart ──────────────────────────────────────────────────── */}
      <div className="panel p-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Signal size={12} className="text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-400 font-mono">RSSI SIGNAL</span>
          <span className="ml-auto text-xs font-mono text-slate-400">
            {formatRssi(analysis?.avgRssi ?? -70)}
          </span>
        </div>
        <div style={{ height: 60 }}>
          <Line data={rssiChartData} options={chartOptions} />
        </div>
      </div>

      {/* ─── Variance Chart ──────────────────────────────────────────────── */}
      <div className="panel p-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={12} className="text-purple-400" />
          <span className="text-xs font-semibold text-purple-400 font-mono">VARIANCE</span>
          <span className="ml-auto text-xs font-mono text-slate-400">
            {(analysis?.variance ?? 0).toFixed(1)} dBm²
          </span>
        </div>
        <div style={{ height: 60 }}>
          <Line data={varianceChartData} options={chartOptions} />
        </div>
      </div>

      {/* ─── Signal Metrics ──────────────────────────────────────────────── */}
      <div className="panel p-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={12} className="text-green-400" />
          <span className="text-xs font-semibold text-green-400 font-mono">SIGNAL METRICS</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="INSTABILITY"
            value={`${Math.round((analysis?.instability ?? 0) * 100)}%`}
            color="#f59e0b"
          />
          <MetricCard
            label="ACTIVITY"
            value={(analysis?.activityLevel ?? 'idle').toUpperCase()}
            color="#10b981"
          />
          <MetricCard
            label="OCCUPANCY"
            value={`${analysis?.occupancyProbability ?? 0}%`}
            color="#00d4ff"
          />
          <MetricCard
            label="MOVEMENT"
            value={`${analysis?.movementIntensity ?? 0}%`}
            color="#7c3aed"
          />
        </div>
      </div>

      {/* ─── Bluetooth Devices ───────────────────────────────────────────── */}
      <div className="panel p-3 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Bluetooth size={12} className="text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-400 font-mono">BT DEVICES</span>
          <span className="ml-auto text-xs font-mono text-slate-500">{devices.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {devices.length === 0 ? (
            <div className="text-center py-4 text-slate-600 text-xs font-mono">
              Scanning for devices...
            </div>
          ) : (
            devices.map((device, i) => (
              <DeviceRow key={device.id} device={device} index={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded p-2 text-center"
      style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}22` }}>
      <div className="text-xs font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-[9px] text-slate-600 font-mono mt-0.5">{label}</div>
    </div>
  );
}

function DeviceRow({ device, index }: { device: BluetoothDevice; index: number }) {
  const rssiColor = getRssiColor(device.rssi);
  const strength = getSignalStrength(device.rssi);
  const bars = device.rssi >= -50 ? 4 : device.rssi >= -65 ? 3 : device.rssi >= -80 ? 2 : 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-2 p-2 rounded"
      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,212,255,0.08)' }}>

      {/* Signal bars */}
      <div className="flex items-end gap-0.5 w-5">
        {[1, 2, 3, 4].map(b => (
          <div
            key={b}
            className="w-1 rounded-sm"
            style={{
              height: `${b * 3 + 2}px`,
              background: b <= bars ? rssiColor : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>

      {/* Device info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-slate-300 truncate">{device.name}</div>
        <div className="text-[9px] text-slate-600 font-mono">{device.type}</div>
      </div>

      {/* RSSI */}
      <div className="text-right">
        <div className="text-xs font-mono font-bold" style={{ color: rssiColor }}>
          {device.rssi}
        </div>
        <div className="text-[9px] text-slate-600">dBm</div>
      </div>
    </motion.div>
  );
}
