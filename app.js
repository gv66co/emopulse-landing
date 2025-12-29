import streamlit as st
import time

st.set_page_config(page_title="Emopulse Demo", layout="centered")
st.title("Emopulse Demo")
st.markdown("Record for minimum 1 min. Emotion Recognition and Pulse Signal Processing are in BETA.")

col1, col2 = st.columns(2)
with col1:
    if st.button("Try Smile"):
        st.session_state['scenario'] = "smile"
        st.info("Natasha: I see your joy shining through — keep breathing gently.")
    if st.button("Try Neutral"):
        st.session_state['scenario'] = "neutral"
        st.info("Natasha: Calm and steady. Signal looks stable.")
    if st.button("Try Stress"):
        st.session_state['scenario'] = "stress"
        st.warning("Natasha: I sense tension — slow your breath and relax your shoulders.")

with col2:
    st.write("Status")
    progress = st.progress(0)

scenario = st.session_state.get('scenario', 'neutral')
placeholder = st.empty()
for i in range(1, 101, 10):
    time.sleep(0.03)
    progress.progress(i)
    placeholder.text(f"Calibrating {i}%")

def fake_analysis(scenario):
    base = {
        "neutral": ("neutral", 0.85, 72),
        "smile": ("joyful", 0.92, 75),
        "stress": ("anxious", 0.78, 90)
    }
    return base.get(scenario, ("neutral", 0.80, 72))

emotion, confidence, pulse_bpm = fake_analysis(scenario)
st.subheader("Result")
st.write(f"**Emotion:** {emotion}")
st.write(f"**Confidence:** {confidence}")
st.write(f"**Pulse BPM:** {pulse_bpm}")
st.markdown("---")
st.write("API endpoints: `POST /api/analyze` ; `GET /api/health`")
