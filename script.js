const API_URL = "https://emopulse-api-1009590211108.europe-west4.run.app";
async function analyzeFrame(frame) {
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frame })
    });

    const data = await response.json();
    console.log("API response:", data);
    return data;

  } catch (error) {
    console.error("API error:", error);
  }
}
