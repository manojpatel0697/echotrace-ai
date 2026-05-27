'use client';

import { useEffect, useRef } from 'react';
import type { SignalAnalysis } from '@/app/types';

interface HeatCell {
  x: number;
  y: number;
  value: number;
  targetValue: number;
}

interface OccupancyHeatmapProps {
  analysis?: SignalAnalysis;
  size: number;
}

const COLS = 12;
const ROWS = 12;

export default function OccupancyHeatmap({ analysis, size }: OccupancyHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellsRef = useRef<HeatCell[]>([]);
  const animRef = useRef<number>(0);

  // Initialize cells once
  useEffect(() => {
    cellsRef.current = Array.from({ length: ROWS * COLS }, (_, idx) => ({
      x: idx % COLS,
      y: Math.floor(idx / COLS),
      value: 0,
      targetValue: 0,
    }));
  }, []);

  // Update cell targets when analysis changes
  useEffect(() => {
    if (!analysis) return;
    const occ = analysis.occupancyProbability / 100;
    const movement = analysis.movementIntensity / 100;
    const cx = COLS / 2;
    const cy = ROWS / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);

    cellsRef.current = cellsRef.current.map(cell => {
      const dist = Math.sqrt((cell.x - cx) ** 2 + (cell.y - cy) ** 2);
      const proximity = 1 - dist / maxDist;
      const base = occ * proximity * proximity;
      const noise = (Math.random() - 0.5) * movement * 0.3;
      return { ...cell, targetValue: Math.max(0, Math.min(1, base + noise)) };
    });
  }, [analysis]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cellW = size / COLS;
      const cellH = size / ROWS;

      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = 'rgba(2, 8, 23, 0.9)';
      ctx.fillRect(0, 0, size, size);

      cellsRef.current = cellsRef.current.map(cell => {
        const updated = { ...cell, value: cell.value + (cell.targetValue - cell.value) * 0.08 };
        const px = updated.x * cellW;
        const py = updated.y * cellH;
        const v = updated.value;

        if (v > 0.02) {
          let r: number, g: number, b: number;
          if (v < 0.5) {
            r = Math.round(v * 2 * 245); g = 185; b = Math.round(129 * (1 - v * 2));
          } else {
            r = 239; g = Math.round(185 * (1 - (v - 0.5) * 2)); b = 0;
          }
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${v * 0.7})`;
          ctx.fillRect(px + 1, py + 1, cellW - 2, cellH - 2);
          if (v > 0.5) {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${v * 0.4})`;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(px + 1, py + 1, cellW - 2, cellH - 2);
          }
        }
        return updated;
      });

      // Grid lines
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.06)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= COLS; i++) {
        ctx.beginPath(); ctx.moveTo(i * cellW, 0); ctx.lineTo(i * cellW, size); ctx.stroke();
      }
      for (let j = 0; j <= ROWS; j++) {
        ctx.beginPath(); ctx.moveTo(0, j * cellH); ctx.lineTo(size, j * cellH); ctx.stroke();
      }

      // Outer border
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, size, size);

      // Legend
      const legendY = size - 16;
      [['LOW', 'rgba(16,185,129,0.7)'], ['MEDIUM', 'rgba(245,158,11,0.7)'], ['HIGH', 'rgba(239,68,68,0.7)']].forEach(([label, color], i) => {
        const lx = 10 + i * 80;
        ctx.fillStyle = color;
        ctx.fillRect(lx, legendY, 12, 8);
        ctx.fillStyle = 'rgba(148,163,184,0.6)';
        ctx.font = '8px monospace';
        ctx.fillText(label, lx + 15, legendY + 7);
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="text-xs font-mono text-slate-500 tracking-wider">OCCUPANCY HEATMAP</div>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-lg"
        style={{
          maxWidth: '100%',
          maxHeight: 'calc(100% - 40px)',
          filter: 'drop-shadow(0 0 15px rgba(0,212,255,0.1))',
        }}
      />
    </div>
  );
}
