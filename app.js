
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import bodyParser from "body-parser";
import cors from "cors";
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Analyze endpoint (stub)
app.post("/api/analyze", (req, res) => {
  const scenario = req.body.scenario || "neutral";
  const map = {
    neutral: { emotion: "neutral", confidence: 0.85, pulse_bpm: 72, insight: "Natasha: You appear calm and steady. Consider a short check-in later." },
    smile: { emotion: "joyful", confidence: 0.92, pulse_bpm: 75, insight: "Natasha: Joyful signals detected — your energy looks positive." },
    stress: { emotion: "anxious", confidence: 0.78, pulse_bpm: 90, insight: "Natasha: Tension detected — try a 30s breathing exercise." },
    high_stress: { emotion: "anxious", confidence: 0.65, pulse_bpm: 110, insight: "Natasha: High stress — consider pausing and breathing." },
    calm: { emotion: "calm", confidence: 0.95, pulse_bpm: 60, insight: "Natasha: Very calm and stable signals — great state." },
    focused: { emotion: "focused", confidence: 0.88, pulse_bpm: 68, insight: "Natasha: Focused state — keep momentum." },
    energy: { emotion: "energetic", confidence: 0.9, pulse_bpm: 82, insight: "Natasha: Elevated energy — channel it into a short task." },
    conf_drop: { emotion: "neutral", confidence: 0.55, pulse_bpm: 74, insight: "Natasha: Confidence dip — small grounding exercise recommended." }
  };
  const base = map[scenario] || map["neutral"];
  res.json(base);
});

// Proxy /demo to Streamlit
app.use("/demo", createProxyMiddleware({
  target: "http://ppg-demo:8501/",
  changeOrigin: true,
  pathRewrite: { "^/demo": "/" },
  onError: (err, req, res) => {
    res.status(502).json({ error: "Demo proxy error" });
  }
}));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API running on ${PORT}`));
``
