/* =========================================
   EMOPULSE PRO – CORE DESIGN SYSTEM
   ========================================= */

:root {
    /* Spalvų paletė */
    --bg-dark: #020408;
    --bg-gradient: radial-gradient(circle at 15% 15%, #0a1a3a 0%, #020408 100%);
    --accent-blue: #3abff8;
    --accent-purple: #7b5cff;
    --accent-gold: #fbbf24;
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    
    /* Panelės ir stiklo efektai */
    --panel-bg: rgba(15, 23, 42, 0.7);
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
}

* {
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
}

body {
    margin: 0;
    padding: 0;
    background: var(--bg-gradient);
    color: var(--text-main);
    font-family: 'Inter', -apple-system, sans-serif;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Pagrindinis Konteineris */
.app-container {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    grid-template-rows: auto auto;
    gap: 25px;
    max-width: 1400px;
    width: 95%;
    padding: 20px;
}

/* =========================================
   KOMPONENTŲ STILIUS
   ========================================= */

.emo-panel {
    background: var(--panel-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    padding: 30px;
    box-shadow: var(--glass-shadow);
    transition: transform 0.3s ease, border-color 0.3s ease;
}

.emo-panel:hover {
    border-color: rgba(58, 191, 248, 0.3);
}

/* Kameros ir Scenos Skiltis */
.stage-3d {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 10;
    background: #000;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

#cam {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1); /* Veidrodinis vaizdas natūralumui */
}

/* Tekstų hierarchija */
.hero-title {
    font-size: 2.8rem;
    font-weight: 800;
    margin: 0 0 10px 0;
    letter-spacing: -1.5px;
    background: linear-gradient(to right, #fff, var(--accent-blue));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.signature-text {
    font-size: 1.25rem;
    line-height: 1.6;
    color: var(--text-main);
    font-weight: 300;
    margin-bottom: 20px;
    border-left: 3px solid var(--accent-purple);
    padding-left: 20px;
}

/* Metrikų kortelės (Apačioje) */
.bottom-metrics {
    grid-column: 1 / span 2;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

.metric-box {
    text-align: left;
}

.metric-box h4 {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 0 0 15px 0;
}

.metric-value {
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--accent-blue);
    font-variant-numeric: tabular-nums;
}

/* Statuso indikatoriai ir Tags */
.tag-container {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.tag {
    font-size: 0.7rem;
    padding: 4px 12px;
    border-radius: 100px;
    background: rgba(123, 92, 255, 0.15);
    color: var(--accent-purple);
    border: 1px solid rgba(123, 92, 255, 0.3);
    font-weight: 600;
    text-transform: uppercase;
}

/* Canvas grafikai */
canvas.mini-chart {
    width: 100%;
    height: 60px;
    margin-top: 15px;
    opacity: 0.8;
}

/* Responsyvumas */
@media (max-width: 1024px) {
    .app-container {
        grid-template-columns: 1fr;
    }
    .bottom-metrics {
        grid-column: 1;
        grid-template-columns: 1fr;
    }
}
