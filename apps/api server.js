import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.post("/api/analyze", (req, res) => {
  const scenario = req.body.scenario || "neutral";
  const map = {
    neutral: { emotion: "neutral", confidence: 0.85, pulse_bpm: 72, natasha_hint: "Natasha: Calm and steady." },
    smile: { emotion: "joyful", confidence: 0.92, pulse_bpm: 75, natasha_hint: "Natasha: Joy detected." },
    stress: { emotion: "anxious", confidence: 0.78, pulse_bpm: 90, natasha_hint: "Natasha: Tension detected." }
  };
  res.json(map[scenario] || map["neutral"]);
});

app.use("/demo", createProxyMiddleware({
  target: process.env.PPG_DEMO_URL || "http://localhost:8501",
  changeOrigin: true,
  pathRewrite: { "^/demo": "/" },
  onError: (err, req, res) => res.status(502).json({ error: "Demo proxy error" })
}));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Rotatehandler API running on ${PORT}`));
