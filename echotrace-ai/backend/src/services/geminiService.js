/**
 * Gemini AI Service
 * Google Gemini API with rate limiting and intelligent fallback
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;
let lastCallTime = 0;
let quotaExceededUntil = 0;
const MIN_CALL_INTERVAL_MS = 4000; // ~15 calls/min — safe under free tier

const initGemini = () => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[Gemini] No API key — using fallback engine');
    return false;
  }
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('[Gemini] Initialized successfully');
    return true;
  } catch (err) {
    console.warn('[Gemini] Init failed:', err.message);
    return false;
  }
};

const interpretSignalData = async (signalData, agentType = 'presence') => {
  if (model) {
    const now = Date.now();

    // Quota backoff
    if (now < quotaExceededUntil) {
      return fallback(agentType, signalData);
    }

    // Per-call rate limit
    if (now - lastCallTime < MIN_CALL_INTERVAL_MS) {
      return fallback(agentType, signalData);
    }

    try {
      lastCallTime = Date.now();
      const result = await model.generateContent(buildPrompt(agentType, signalData));
      return {
        message: result.response.text().trim(),
        source: 'gemini',
        confidence: calculateConfidence(signalData),
      };
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('429') || msg.includes('quota')) {
        const retryMatch = msg.match(/retryDelay['":\s]+(\d+)/);
        const backoffMs = retryMatch ? parseInt(retryMatch[1]) * 1000 : 65000;
        quotaExceededUntil = Date.now() + backoffMs;
        console.warn(`[Gemini] Quota exceeded — backing off ${Math.round(backoffMs / 1000)}s`);
      } else {
        console.warn('[Gemini] API error, using fallback:', msg.split('\n')[0]);
      }
    }
  }

  return fallback(agentType, signalData);
};

const fallback = (agentType, signalData) => ({
  message: generateFallbackInterpretation(agentType, signalData),
  source: 'fallback',
  confidence: calculateConfidence(signalData),
});

const buildPrompt = (agentType, data) => {
  const base = `You are an AI agent in EchoTrace, a wireless human presence sensing system.
Analyze this Bluetooth RSSI signal data and provide a brief, technical, futuristic interpretation.
Keep response under 2 sentences. Sound intelligent and precise.

Signal Data:
- Occupancy Probability: ${data.occupancyProbability}%
- Movement Intensity: ${data.movementIntensity}%
- Activity Level: ${data.activityLevel}
- Signal Variance: ${data.variance} dBm²
- Active Devices: ${data.deviceCount}
- Anomalies: ${data.anomalies?.length || 0} detected
- Average RSSI: ${data.avgRssi || 'N/A'} dBm`;

  const instructions = {
    signal:    `${base}\n\nAs the Signal Agent, report on RSSI behavior and signal quality patterns.`,
    presence:  `${base}\n\nAs the Presence Agent, estimate human occupancy and presence likelihood.`,
    activity:  `${base}\n\nAs the Activity Agent, describe the estimated movement type and intensity.`,
    safety:    `${base}\n\nAs the Safety Agent, identify anomalies or unusual patterns needing attention.`,
    analytics: `${base}\n\nAs the Analytics Agent, summarize overall wireless sensing trends.`,
  };

  return instructions[agentType] || instructions.presence;
};

const generateFallbackInterpretation = (agentType, data) => {
  const { occupancyProbability: occ, movementIntensity: mov, activityLevel, variance, deviceCount, anomalies } = data;

  const interpretations = {
    signal: () => {
      if (variance < 5)  return `Signal environment stable. RSSI variance ${variance} dBm² — minimal disturbance across ${deviceCount} device(s).`;
      if (variance < 20) return `Moderate signal fluctuation detected. Variance: ${variance} dBm². Consistent with low-level activity.`;
      return `Significant RSSI instability. Variance: ${variance} dBm² across ${deviceCount} device(s). Active environmental changes detected.`;
    },
    presence: () => {
      if (occ < 20) return `Occupancy probability: ${occ}%. Wireless environment suggests unoccupied zone.`;
      if (occ < 60) return `Occupancy probability: ${occ}%. Signal disturbance patterns indicate possible human presence.`;
      return `High occupancy confidence: ${occ}%. Signal analysis strongly suggests active human presence. ${deviceCount} device(s) contributing.`;
    },
    activity: () => {
      if (activityLevel === 'idle')     return `Activity: IDLE. Signal patterns consistent with stationary environment.`;
      if (activityLevel === 'low')      return `Low-level activity detected. Movement intensity: ${mov}%. Minor positional adjustments estimated.`;
      if (activityLevel === 'moderate') return `Moderate movement detected. Intensity: ${mov}%. Patterns consistent with walking or active presence.`;
      return `High-intensity movement. Intensity: ${mov}%. Rapid signal fluctuations indicate energetic activity.`;
    },
    safety: () => {
      if (!anomalies?.length) return `Safety scan nominal. No anomalous patterns detected. ${deviceCount} device(s) within expected parameters.`;
      const top = anomalies[0];
      return `⚠ Anomaly: ${top.description}. Severity: ${top.severity?.toUpperCase()}. Immediate signal pattern review recommended.`;
    },
    analytics: () =>
      `Summary: ${deviceCount} device(s) active, ${occ}% occupancy confidence, ${mov}% movement intensity. Classification: ${activityLevel.toUpperCase()}.`,
  };

  return (interpretations[agentType] || interpretations.presence)();
};

const calculateConfidence = (data) => {
  let confidence = 40;
  confidence += Math.min((data.deviceCount || 0) * 5, 20);
  if (data.activityLevel && data.activityLevel !== 'idle') confidence += 10;
  if ((data.variance || 0) > 10) confidence += 10;
  if ((data.movementIntensity || 0) > 30) confidence += 10;
  if ((data.occupancyProbability || 0) > 50) confidence += 8;
  return Math.min(Math.round(confidence), 98);
};

initGemini();

module.exports = { interpretSignalData, generateFallbackInterpretation, calculateConfidence, initGemini };
