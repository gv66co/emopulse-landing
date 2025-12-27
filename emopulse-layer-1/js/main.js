// js/main.js
import { subscribe } from "./state.js";

import {
  renderSidebar,
  bindSidebarEvents,
} from "./components/sidebar.js";
import {
  renderPulseCanvas,
} from "./components/pulseCanvas.js";
import { renderCoach } from "./components/coach.js";
import { renderResultsBox } from "./components/resultsBox.js";
import { renderMiniDashboard } from "./components/miniDashboard.js";

import { renderTextMode } from "./modes/textMode.js";
import { renderVoiceMode } from "./modes/voiceMode.js";
import { renderWebcamMode } from "./modes/webcamMode.js";
import { renderSignalsMode } from "./modes/signalsMode.js";
import { renderPulseMode } from "./modes/pulseMode.js";
import { getState } from "./state.js";

function renderModePanel() {
  const root = document.getElementById("mode-panel-root");
  const { mode } = getState();

  if (mode === "text") renderTextMode(root);
  else if (mode === "voice") renderVoiceMode(root);
  else if (mode === "webcam") renderWebcamMode(root);
  else if (mode === "signals") renderSignalsMode(root);
  else if (mode === "pulse") renderPulseMode(root);
}

function init() {
  renderSidebar(document.getElementById("sidebar-root"));
  renderPulseCanvas(document.getElementById("pulse-root"));
  renderModePanel();
  renderCoach(document.getElementById("coach-root"));
  renderResultsBox(document.getElementById("results-root"));
  renderMiniDashboard(document.getElementById("dashboard-root"));

  bindSidebarEvents();

  subscribe(() => {
    renderModePanel();
  });
}

init();
