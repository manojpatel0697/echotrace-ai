'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { SignalAnalysis } from '@/app/types';

interface RadarCanvasProps {
  analysis?: SignalAnalysis;
  isDemoMode: boolean;
  width?: number;
  height?: number;
}

interface OccupancyBlob {
  x: number;
  y: number;
  radius: number;
  targetRadius: number;
  intensity: number;
  age: number;
  maxAge: number;
  vx: number;
  vy: number;
}

interface RippleWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

export default function RadarCanvas({
  analysis,
  isDemoMode,
  width = 500,
  height = 500,
}: RadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const sweepAngleRef = useRef<number>(0);
  const blobsRef = useRef<OccupancyBlob[]>([]);
  const ripplesRef = useRef<RippleWave[]>([]);
  const tickRef = useRef<number>(0);

  // ─── Spawn occupancy blobs based on signal analysis ─────────────────────
  const updateBlobs = useCallback((occ: number, movement: number) => {
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.min(width, height) * 0.38;

    // Spawn new blobs when occupancy is significant
    if (occ > 15 && blobsRef.current.length < 6 && Math.random() < 0.04) {
      const angle = Math.random() * Math.PI * 2;
      const dist = (0.2 + Math.random() * 0.6) * maxR;
      blobsRef.current.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        radius: 5,
        targetRadius: 15 + (occ / 100) * 35 + Math.random() * 20,
        intensity: occ / 100,
        age: 0,
        maxAge: 120 + Math.random() * 80,
        vx: (Math.random() - 0.5) * (movement / 100) * 1.5,
        vy: (Math.random() - 0.5) * (movement / 100) * 1.5,
      });
    }

    // Update existing blobs
    blobsRef.current = blobsRef.current
      .map(b => ({
        ...b,
        age: b.age + 1,
        x: b.x + b.vx,
        y: b.y + b.vy,
        radius: b.radius + (b.targetRadius - b.radius) * 0.05,
        intensity: b.age < b.maxAge * 0.7
          ? b.intensity
          : b.intensity * (1 - (b.age - b.maxAge * 0.7) / (b.maxAge * 0.3)),
      }))
      .filter(b => b.age < b.maxAge && b.intensity > 0.01);
  }, [width, height]);

  // ─── Spawn ripple waves on movement ─────────────────────────────────────
  const spawnRipple = useCallback((movement: number, occ: number) => {
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.min(width, height) * 0.38;

    if (movement > 20 && Math.random() < 0.06) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * maxR * 0.7;
      const color = occ > 70 ? '#ef4444' : occ > 40 ? '#f59e0b' : '#00d4ff';
      ripplesRef.current.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        radius: 5,
        maxRadius: 30 + (movement / 100) * 50,
        opacity: 0.7,
        color,
      });
    }

    ripplesRef.current = ripplesRef.current
      .map(r => ({
        ...r,
        radius: r.radius + 2,
        opacity: r.opacity * 0.93,
      }))
      .filter(r => r.opacity > 0.02);
  }, [width, height]);

  // ─── Main draw loop ──────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.min(width, height) * 0.42;
    const occ = analysis?.occupancyProbability ?? 0;
    const movement = analysis?.movementIntensity ?? 0;

    tickRef.current++;

    // Update simulation
    updateBlobs(occ, movement);
    spawnRipple(movement, occ);

    // ─── Clear ────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, width, height);

    // ─── Background ───────────────────────────────────────────────────────
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    bgGrad.addColorStop(0, 'rgba(0, 212, 255, 0.04)');
    bgGrad.addColorStop(0.5, 'rgba(0, 10, 30, 0.8)');
    bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
    ctx.fill();

    // ─── Concentric rings ─────────────────────────────────────────────────
    const ringCount = 4;
    for (let i = 1; i <= ringCount; i++) {
      const r = (maxR / ringCount) * i;
      const alpha = 0.08 + (i === ringCount ? 0.06 : 0);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
      ctx.lineWidth = i === ringCount ? 1.5 : 0.8;
      ctx.stroke();

      // Ring label
      if (i < ringCount) {
        ctx.fillStyle = 'rgba(0, 212, 255, 0.25)';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillText(`${Math.round((i / ringCount) * 10)}m`, cx + r + 3, cy - 3);
      }
    }

    // ─── Cross-hair lines ─────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.06)';
    ctx.lineWidth = 0.5;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
      ctx.stroke();
    }

    // ─── Occupancy blobs ──────────────────────────────────────────────────
    blobsRef.current.forEach(blob => {
      const alpha = blob.intensity * 0.35;
      const color = occ > 70 ? '239, 68, 68' : occ > 40 ? '245, 158, 11' : '0, 212, 255';

      const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
      grad.addColorStop(0, `rgba(${color}, ${alpha * 1.5})`);
      grad.addColorStop(0.5, `rgba(${color}, ${alpha * 0.6})`);
      grad.addColorStop(1, `rgba(${color}, 0)`);

      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Blob outline pulse
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.radius * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color}, ${alpha * 0.8})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // ─── Ripple waves ─────────────────────────────────────────────────────
    ripplesRef.current.forEach(ripple => {
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = ripple.color + Math.round(ripple.opacity * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // ─── Radar sweep beam ─────────────────────────────────────────────────
    sweepAngleRef.current += 0.025 + (movement / 100) * 0.02;
    const sweepAngle = sweepAngleRef.current;

    // Sweep trail (gradient arc)
    const trailLength = Math.PI * 0.45;

    // Draw sweep trail manually
    const trailSteps = 30;
    for (let i = 0; i < trailSteps; i++) {
      const a = sweepAngle - (trailLength * i) / trailSteps;
      const alpha = (1 - i / trailSteps) * 0.15;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, a - Math.PI / trailSteps, a);
      ctx.closePath();
      ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
      ctx.fill();
    }

    // Sweep leading edge
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(sweepAngle) * maxR,
      cy + Math.sin(sweepAngle) * maxR
    );
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ─── Pulse rings on high occupancy ────────────────────────────────────
    if (occ > 40) {
      const pulsePhase = (tickRef.current % 60) / 60;
      const pulseR = maxR * 0.3 * pulsePhase;
      const pulseAlpha = (1 - pulsePhase) * 0.4 * (occ / 100);
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // ─── Center dot ───────────────────────────────────────────────────────
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
    centerGrad.addColorStop(0, 'rgba(0, 212, 255, 0.9)');
    centerGrad.addColorStop(1, 'rgba(0, 212, 255, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = centerGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // ─── Outer border ─────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ─── Occupancy intensity glow on outer ring ────────────────────────────
    if (occ > 20) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${occ > 70 ? '239,68,68' : occ > 40 ? '245,158,11' : '0,212,255'}, ${occ / 300})`;
      ctx.lineWidth = 8;
      ctx.stroke();
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [analysis, width, height, updateBlobs, spawnRipple]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-full"
      style={{
        background: 'transparent',
        filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.15))',
      }}
    />
  );
}
