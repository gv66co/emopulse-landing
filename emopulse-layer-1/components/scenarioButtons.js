// js/components/scenarioButtons.js

export function renderScenarioButtons(root, scenarios, onSelect) {
  const row = document.createElement("div");
  row.className = "scenario-row";

  row.innerHTML = scenarios
    .map(
      (s) =>
        `<button class="scenario-btn" data-scenario="${s.key}">${s.label}</button>`
    )
    .join("");

  row.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-scenario]");
    if (!btn) return;
    const key = btn.getAttribute("data-scenario");
    onSelect?.(key);
  });

  root.appendChild(row);
}
