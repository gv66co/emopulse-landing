// Cloud Run API base URL
const API_BASE = "https://emopulse-api-1009590211108.europe-west4.run.app";

// Health check
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

// Rotate endpoint
export async function rotateText(text) {
  const res = await fetch(`${API_BASE}/api/rotate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Rotate API error");
  }

  return res.json();
}
