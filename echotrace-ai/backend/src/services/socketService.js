/**
 * Socket.IO Service
 * Manages all real-time communication between backend and frontend
 */

const { activateDemoMode, deactivateDemoMode, getSimulatorState, injectRealScanData } = require('./signalSimulator');

let connectedClients = 0;

const initSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    connectedClients++;
    console.log(`[Socket] Client connected: ${socket.id} (total: ${connectedClients})`);

    // Send current state to newly connected client
    socket.emit('system:state', {
      status: 'connected',
      simulator: getSimulatorState(),
      timestamp: new Date().toISOString(),
    });

    // ─── Demo Mode Controls ─────────────────────────────────────────────────
    socket.on('demo:activate', (data) => {
      const scenario = data?.scenario || null;
      activateDemoMode(io, scenario);
      io.emit('demo:status', { active: true, scenario });
    });

    socket.on('demo:deactivate', () => {
      deactivateDemoMode();
      io.emit('demo:status', { active: false });
    });

    socket.on('demo:scenario', (data) => {
      if (data?.scenario) {
        activateDemoMode(io, data.scenario);
      }
    });

    // ─── Real Scanner Data Injection ────────────────────────────────────────
    socket.on('scanner:data', (data) => {
      injectRealScanData(io, data?.devices || []);
    });

    // ─── Client Requesting State ────────────────────────────────────────────
    socket.on('state:request', () => {
      socket.emit('system:state', {
        status: 'connected',
        simulator: getSimulatorState(),
        timestamp: new Date().toISOString(),
      });
    });

    // ─── Ping/Pong for latency measurement ──────────────────────────────────
    socket.on('ping:client', (data) => {
      socket.emit('pong:server', { ...data, serverTime: Date.now() });
    });

    // ─── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      connectedClients = Math.max(0, connectedClients - 1);
      console.log(`[Socket] Client disconnected: ${socket.id} (${reason}) (remaining: ${connectedClients})`);
    });
  });

  console.log('[Socket] Socket.IO handlers initialized');
};

const getConnectedClients = () => connectedClients;

module.exports = { initSocketHandlers, getConnectedClients };
