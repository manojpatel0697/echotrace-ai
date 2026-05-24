# EchoTrace AI 🛰️

**Next-generation AI-powered wireless human presence sensing platform**

EchoTrace AI uses Bluetooth RSSI signal fluctuation analysis as a pseudo-echolocation mechanism to estimate human presence, occupancy probability, and movement intensity — without cameras.

---

## 🎯 What It Does

- **Bluetooth RSSI scanning** — detects nearby devices and monitors signal strength
- **Signal fluctuation analysis** — stable RSSI = idle, rapid fluctuation = movement
- **AI interpretation** — Gemini AI reasons about occupancy and activity patterns
- **Cinematic radar UI** — sweeping radar beam, occupancy blobs, ripple effects
- **Multi-agent system** — 5 autonomous AI agents communicate in real-time
- **Demo mode** — simulate realistic scenarios for hackathon presentations

---

## 🏗️ Architecture

```
echotrace-ai/
├── frontend/          # Next.js 15 + TypeScript + TailwindCSS + Framer Motion
├── backend/           # Node.js + Express + Socket.IO + Gemini AI
└── scanner/           # Python + Bleak (BLE scanner, auto-falls back to simulation)
```

---

## ⚡ Quick Start

### 1. Clone & Setup

```bash
git clone <repo>
cd echotrace-ai
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY (optional but recommended)
npm install
npm run dev
# Runs on http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
# Runs on http://localhost:3000
```

### 4. Python Scanner (optional — auto-simulates if unavailable)

```bash
cd scanner
pip install -r requirements.txt
cp .env.example .env
python scanner.py
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 4000) |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key |
| `MONGODB_URI` | No | MongoDB Atlas connection string |
| `FRONTEND_URL` | No | Frontend URL for CORS |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | Yes | Backend URL |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | Socket.IO URL |

---

## 🤖 AI Agents

| Agent | Role | Interval |
|-------|------|----------|
| 📡 Signal Agent | Monitors RSSI behavior | 4s |
| 👁 Presence Agent | Estimates occupancy probability | 5s |
| ⚡ Activity Agent | Estimates movement intensity | 6s |
| 🛡 Safety Agent | Detects anomalies | 7s |
| 📊 Analytics Agent | Summarizes trends | 12s |

---

## 🎮 Demo Mode

Click **▶ DEMO** in the top bar to open the demo control panel.

Available scenarios:
- **Idle Room** — minimal signal disturbance
- **Person Entering** — gradual occupancy increase
- **Walking Movement** — active signal fluctuation
- **Multiple People** — high device count + instability
- **Activity Burst** — sudden intense movement event

---

## 🧪 Testing

```bash
# Backend tests (41 tests)
cd backend && npm test

# Frontend tests (32 tests)
cd frontend && npx jest --forceExit

# Python scanner tests
cd scanner && python -m pytest test_scanner.py -v
```

---

## 🚀 Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_BACKEND_URL` → your backend URL
- `NEXT_PUBLIC_SOCKET_URL` → your backend URL

### Backend → Railway / Render / Fly.io

```bash
# Railway
railway login
railway init
railway up

# Or Render — connect GitHub repo, set build command:
# npm install && npm start
```

### Python Scanner → Local only

The scanner runs on your laptop alongside the backend. It auto-simulates if Bluetooth permissions are unavailable.

---

## 📡 Signal Analysis Logic

```
Stable RSSI (variance < 5)     → Idle environment
Moderate fluctuation (5–20)    → Low activity / presence
High fluctuation (20–50)       → Active movement
Extreme fluctuation (50+)      → Intense activity / anomaly

Occupancy = f(variance, device_count, recent_delta)
Movement  = f(avg_delta, max_delta_between_readings)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, Framer Motion |
| Visualization | Canvas/WebGL radar, Chart.js |
| Backend | Node.js, Express, Socket.IO |
| AI | Google Gemini 1.5 Flash |
| Database | MongoDB Atlas (optional) |
| Scanner | Python, Bleak |
| Testing | Jest, React Testing Library |
| Deployment | Vercel (frontend), Railway/Render (backend) |

---

## 💡 Hackathon Notes

- Works **100% offline** — demo mode simulates everything
- **Zero hardware required** — runs on a single laptop
- **Gemini API is optional** — falls back to intelligent rule-based interpretation
- **MongoDB is optional** — runs in-memory without it
- Budget: **₹0** using free tiers

---

## ⚠️ Realistic Scope

EchoTrace AI is an **occupancy interpretation system** based on wireless signal disturbances. It does NOT:
- Track exact body positions
- Provide military-grade radar
- Perform true echolocation imaging
- Reconstruct human silhouettes

It DOES provide:
- Probabilistic occupancy estimation
- Movement intensity classification
- Anomaly detection
- AI-powered signal interpretation
