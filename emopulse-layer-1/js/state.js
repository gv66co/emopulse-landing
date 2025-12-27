// js/state.js

export const MODES = ["text", "voice", "webcam", "signals", "pulse"];

export const STATUSES = [
  "idle",
  "inputting",
  "listening",
  "streaming",
  "analyzing",
  "done",
  "error",
];

const state = {
  mode: "text",
  status: "idle",
  emotion: null,
  confidence: null,
  scores: null,
  pulse: null,
  timeline: [],
  signature: null,
  insights: [],
};

const listeners = new Set();

export function getState() {
  return { ...state };
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  const snapshot = getState();
  listeners.forEach((l) => l(snapshot));
}

export function setMode(mode) {
  if (!MODES.includes(mode)) return;
  state.mode = mode;
  state.status = "idle";
  notify();
}

export function setStatus(status) {
  if (!STATUSES.includes(status)) return;
  state.status = status;
  notify();
}

export function setResult(payload) {
  Object.assign(state, payload);
  notify();
}

export function appendTimeline(entry) {
  state.timeline.push(entry);
  notify();
}
