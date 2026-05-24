"""
EchoTrace AI — Bluetooth Scanner Service
Scans for nearby BLE devices and streams RSSI data to the backend.
Falls back to realistic simulation if Bluetooth permissions fail.
"""

import asyncio
import json
import os
import random
import time
import math
from datetime import datetime
from typing import List, Dict, Optional

import socketio
from dotenv import load_dotenv

load_dotenv()

# ─── Configuration ────────────────────────────────────────────────────────────
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:4000")
SCAN_INTERVAL = float(os.getenv("SCAN_INTERVAL", "1.0"))
MAX_DEVICES = int(os.getenv("MAX_DEVICES", "10"))
SIMULATE_ON_FAIL = os.getenv("SIMULATE_ON_FAIL", "true").lower() == "true"

# ─── Socket.IO Client ─────────────────────────────────────────────────────────
sio = socketio.AsyncClient(
    reconnection=True,
    reconnection_attempts=10,
    reconnection_delay=2,
    logger=False,
    engineio_logger=False,
)

# ─── Simulated Device Pool ────────────────────────────────────────────────────
SIMULATED_DEVICES = [
    {"id": "sim_iphone", "name": "iPhone 15 Pro", "base_rssi": -55},
    {"id": "sim_samsung", "name": "Samsung Galaxy S24", "base_rssi": -62},
    {"id": "sim_macbook", "name": "MacBook Pro", "base_rssi": -48},
    {"id": "sim_airpods", "name": "AirPods Pro", "base_rssi": -70},
    {"id": "sim_watch", "name": "Apple Watch Ultra", "base_rssi": -65},
]

# ─── Scanner State ────────────────────────────────────────────────────────────
scanner_state = {
    "is_real": False,
    "device_history": {},
    "tick": 0,
    "fluctuation": 5.0,
}


# ─── Real Bluetooth Scanner ───────────────────────────────────────────────────

async def scan_bluetooth_real() -> Optional[List[Dict]]:
    """Attempt real BLE scan using Bleak."""
    try:
        from bleak import BleakScanner

        devices = await BleakScanner.discover(timeout=SCAN_INTERVAL * 0.8)
        result = []

        for device in devices[:MAX_DEVICES]:
            rssi = device.rssi if device.rssi is not None else -80
            dev_id = device.address.replace(":", "_").lower()

            # Track RSSI history
            if dev_id not in scanner_state["device_history"]:
                scanner_state["device_history"][dev_id] = []
            scanner_state["device_history"][dev_id].append(rssi)
            scanner_state["device_history"][dev_id] = scanner_state["device_history"][dev_id][-20:]

            result.append({
                "id": dev_id,
                "name": device.name or f"Device_{dev_id[:6]}",
                "rssi": rssi,
                "rssiHistory": scanner_state["device_history"][dev_id],
                "lastSeen": int(time.time() * 1000),
                "isReal": True,
            })

        scanner_state["is_real"] = True
        return result

    except Exception as e:
        print(f"[Scanner] Real BT scan failed: {e}")
        return None


# ─── Simulated Scanner ────────────────────────────────────────────────────────

def scan_bluetooth_simulated() -> List[Dict]:
    """Generate realistic simulated BLE scan data."""
    scanner_state["tick"] += 1
    tick = scanner_state["tick"]
    fluctuation = scanner_state["fluctuation"]

    result = []
    for device in SIMULATED_DEVICES:
        # Sinusoidal drift + random noise for realism
        drift = math.sin(tick * 0.1 + hash(device["id"]) % 10) * 3
        noise = (random.random() - 0.5) * fluctuation
        rssi = int(max(-100, min(-20, device["base_rssi"] + drift + noise)))

        dev_id = device["id"]
        if dev_id not in scanner_state["device_history"]:
            scanner_state["device_history"][dev_id] = []
        scanner_state["device_history"][dev_id].append(rssi)
        scanner_state["device_history"][dev_id] = scanner_state["device_history"][dev_id][-20:]

        result.append({
            "id": dev_id,
            "name": device["name"],
            "rssi": rssi,
            "rssiHistory": scanner_state["device_history"][dev_id],
            "lastSeen": int(time.time() * 1000),
            "isReal": False,
        })

    return result


# ─── Main Scan Loop ───────────────────────────────────────────────────────────

async def scan_loop():
    """Main scanning loop — tries real BT first, falls back to simulation."""
    real_scan_failed = False

    while True:
        try:
            devices = None

            if not real_scan_failed:
                devices = await scan_bluetooth_real()

            if devices is None:
                if not real_scan_failed:
                    print("[Scanner] Switching to simulation mode")
                    real_scan_failed = True
                devices = scan_bluetooth_simulated()

            # Emit to backend
            if sio.connected:
                await sio.emit("scanner:data", {
                    "devices": devices,
                    "timestamp": datetime.utcnow().isoformat(),
                    "isReal": scanner_state["is_real"],
                    "deviceCount": len(devices),
                })

                mode = "REAL" if scanner_state["is_real"] else "SIM"
                print(f"[Scanner] [{mode}] Sent {len(devices)} devices | "
                      f"Avg RSSI: {sum(d['rssi'] for d in devices) // len(devices) if devices else 0} dBm")

        except Exception as e:
            print(f"[Scanner] Loop error: {e}")

        await asyncio.sleep(SCAN_INTERVAL)


# ─── Socket Events ────────────────────────────────────────────────────────────

@sio.event
async def connect():
    print(f"[Scanner] Connected to backend: {BACKEND_URL}")


@sio.event
async def disconnect():
    print("[Scanner] Disconnected from backend")


@sio.on("demo:scenario")
async def on_demo_scenario(data):
    """Adjust simulation intensity based on demo scenario."""
    scenario = data.get("scenario", "idle")
    fluctuation_map = {
        "idle": 2.0,
        "person_entering": 12.0,
        "walking": 18.0,
        "multiple_people": 22.0,
        "activity_burst": 30.0,
    }
    scanner_state["fluctuation"] = fluctuation_map.get(scenario, 5.0)
    print(f"[Scanner] Scenario changed to: {scenario} (fluctuation: {scanner_state['fluctuation']})")


# ─── Entry Point ──────────────────────────────────────────────────────────────

async def main():
    print(f"""
╔══════════════════════════════════════════╗
║       EchoTrace AI — BT Scanner          ║
║  Wireless Human Presence Sensing         ║
╚══════════════════════════════════════════╝
  Backend: {BACKEND_URL}
  Scan interval: {SCAN_INTERVAL}s
  Max devices: {MAX_DEVICES}
  Simulate on fail: {SIMULATE_ON_FAIL}
""")

    # Connect to backend
    try:
        await sio.connect(BACKEND_URL, transports=["websocket", "polling"])
    except Exception as e:
        print(f"[Scanner] Backend connection failed: {e}")
        print("[Scanner] Running in offline mode (data will be buffered)")

    # Start scan loop
    await scan_loop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[Scanner] Stopped by user")
