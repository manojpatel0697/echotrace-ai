'use client';

import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('@/app/components/Dashboard'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

function LoadingScreen() {
  return (
    <div
      className="flex items-center justify-center w-full h-screen grid-bg"
      style={{ background: '#020817' }}
    >
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-cyan-500/50 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="4 2" />
              <circle cx="20" cy="20" r="10" stroke="#7c3aed" strokeWidth="1.5" />
              <circle cx="20" cy="20" r="3" fill="#00d4ff" />
              <line
                x1="20" y1="2" x2="20" y2="20"
                stroke="#00d4ff" strokeWidth="1.5"
                style={{ transformOrigin: '20px 20px', animation: 'radar-sweep 2s linear infinite' }}
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-cyan-400 text-glow-cyan mb-2">EchoTrace AI</h1>
        <p className="text-slate-400 text-sm font-mono">Initializing wireless sensing platform...</p>
        <div className="flex justify-center gap-1 mt-4">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-cyan-500"
              style={{ animation: `blink-dot 1.2s ease-in-out ${i * 0.4}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return <Dashboard />;
}
