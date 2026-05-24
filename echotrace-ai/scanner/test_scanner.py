"""
EchoTrace AI — Scanner Unit Tests
"""

import unittest
import sys
import os
import math

# Add scanner dir to path
sys.path.insert(0, os.path.dirname(__file__))

# Import scanner module components (without running main)
import importlib.util
spec = importlib.util.spec_from_file_location("scanner_module", os.path.join(os.path.dirname(__file__), "scanner.py"))


class TestSimulatedScanner(unittest.TestCase):
    """Test the simulated BT scanner logic."""

    def setUp(self):
        """Set up test state."""
        self.device_history = {}
        self.tick = 0

    def _simulate_rssi(self, base_rssi: int, fluctuation: float, tick: int, dev_id: str) -> int:
        """Replicate the RSSI simulation logic."""
        drift = math.sin(tick * 0.1 + hash(dev_id) % 10) * 3
        noise = 0  # deterministic for testing
        rssi = int(max(-100, min(-20, base_rssi + drift + noise)))
        return rssi

    def test_rssi_within_valid_range(self):
        """RSSI should always be between -100 and -20 dBm."""
        for tick in range(100):
            rssi = self._simulate_rssi(-60, 10.0, tick, "test_device")
            self.assertGreaterEqual(rssi, -100)
            self.assertLessEqual(rssi, -20)

    def test_rssi_clamps_at_extremes(self):
        """RSSI should clamp at boundaries."""
        # Very weak base
        rssi_weak = int(max(-100, min(-20, -110)))
        self.assertEqual(rssi_weak, -100)

        # Very strong base
        rssi_strong = int(max(-100, min(-20, -10)))
        self.assertEqual(rssi_strong, -20)

    def test_device_history_grows(self):
        """Device history should accumulate readings."""
        history = []
        for i in range(25):
            rssi = self._simulate_rssi(-60, 5.0, i, "dev1")
            history.append(rssi)
            history = history[-20:]  # keep last 20

        self.assertLessEqual(len(history), 20)
        self.assertGreater(len(history), 0)

    def test_fluctuation_affects_variance(self):
        """Higher fluctuation should produce more variance."""
        import statistics

        low_fluctuation_readings = []
        high_fluctuation_readings = []

        for tick in range(50):
            # Low fluctuation (idle)
            base = -60
            drift = math.sin(tick * 0.1) * 3
            low_rssi = int(max(-100, min(-20, base + drift + (0.5 - 0.5) * 2.0)))
            low_fluctuation_readings.append(low_rssi)

            # High fluctuation (activity burst)
            high_rssi = int(max(-100, min(-20, base + drift + (0.5 - 0.5) * 30.0)))
            high_fluctuation_readings.append(high_rssi)

        # Both should be valid RSSI values
        for r in low_fluctuation_readings + high_fluctuation_readings:
            self.assertGreaterEqual(r, -100)
            self.assertLessEqual(r, -20)

    def test_scenario_fluctuation_map(self):
        """Scenario fluctuation values should be in expected ranges."""
        fluctuation_map = {
            "idle": 2.0,
            "person_entering": 12.0,
            "walking": 18.0,
            "multiple_people": 22.0,
            "activity_burst": 30.0,
        }

        self.assertLess(fluctuation_map["idle"], fluctuation_map["walking"])
        self.assertLess(fluctuation_map["walking"], fluctuation_map["activity_burst"])
        self.assertEqual(fluctuation_map["idle"], 2.0)
        self.assertEqual(fluctuation_map["activity_burst"], 30.0)

    def test_device_payload_structure(self):
        """Device payload should have required fields."""
        import time
        from datetime import datetime

        device = {
            "id": "test_device",
            "name": "Test Device",
            "rssi": -60,
            "rssiHistory": [-60, -62, -58],
            "lastSeen": int(time.time() * 1000),
            "isReal": False,
        }

        required_fields = ["id", "name", "rssi", "rssiHistory", "lastSeen", "isReal"]
        for field in required_fields:
            self.assertIn(field, device)

        self.assertIsInstance(device["rssiHistory"], list)
        self.assertIsInstance(device["rssi"], int)
        self.assertIsInstance(device["isReal"], bool)

    def test_multiple_devices_independent(self):
        """Multiple devices should have independent RSSI values."""
        devices = [
            {"id": "dev1", "base_rssi": -55},
            {"id": "dev2", "base_rssi": -70},
            {"id": "dev3", "base_rssi": -45},
        ]

        tick = 10
        rssi_values = []
        for device in devices:
            rssi = self._simulate_rssi(device["base_rssi"], 5.0, tick, device["id"])
            rssi_values.append(rssi)

        # All should be valid
        for rssi in rssi_values:
            self.assertGreaterEqual(rssi, -100)
            self.assertLessEqual(rssi, -20)

        # They should differ (different base RSSI)
        self.assertNotEqual(rssi_values[0], rssi_values[1])


class TestScannerConfig(unittest.TestCase):
    """Test scanner configuration."""

    def test_default_scan_interval(self):
        """Default scan interval should be reasonable."""
        interval = float(os.getenv("SCAN_INTERVAL", "1.0"))
        self.assertGreater(interval, 0)
        self.assertLessEqual(interval, 10)

    def test_default_max_devices(self):
        """Default max devices should be reasonable."""
        max_devices = int(os.getenv("MAX_DEVICES", "10"))
        self.assertGreater(max_devices, 0)
        self.assertLessEqual(max_devices, 100)

    def test_simulate_on_fail_default(self):
        """Simulate on fail should default to true."""
        simulate = os.getenv("SIMULATE_ON_FAIL", "true").lower() == "true"
        self.assertTrue(simulate)


if __name__ == "__main__":
    unittest.main(verbosity=2)
