
:root {
  --bg: #f6fbff;
  --text: #0b2545;
  --accent: #0078FF;
  --accent-2: #7FC8FF;
  --muted: #6b7a90;
  --card: #ffffff;
}
body {
  font-family: Inter, system-ui, Arial;
  background: var(--bg);
  color: var(--text);
  margin: 0;
}
.hero {
  background: linear-gradient(180deg, rgba(0,120,255,0.08), rgba(127,200,255,0.02));
  padding: 56px 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.hero-inner {
  max-width: 1100px;
  width: 100%;
  display: flex;
  gap: 28px;
  align-items: center;
}
.logo {
  width: 84px;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(11,37,69,0.06);
  background: #fff;
  padding: 12px;
}
.hero-copy h1 {
  margin: 0;
  font-size: 40px;
  letter-spacing: -0.6px;
}
.lead {
  color: var(--muted);
  margin-top: 8px;
  max-width: 640px;
}
.btn {
  display: inline-block;
  padding: 12px 20px;
  background: var(--accent);
  color: #fff;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  transition: transform .12s, box-shadow .12s;
  box-shadow: 0 8px 20px rgba(7,90,200,0.12);
}
.btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(7,90,200,0.14);
}
.container {
  max-width: 1100px;
  margin: 40px auto;
  padding: 0 16px;
}
.how .bullets {
  display: flex;
  gap: 18px;
  margin-top: 18px;
}
.card {
  background: var(--card);
  padding: 18px;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(11,37,69,0.06);
  flex: 1;
}
.features ul {
  color: var(--muted);
  padding-left: 20px;
}
.cta {
  text-align: center;
  margin: 40px 0;
}
footer {
  text-align: center;
  padding: 20px;
  color: var(--muted);
  font-size: 14px;
}
@media (max-width:800px) {
  .hero-inner { flex-direction: column; text-align: center; }
  .how .bullets { flex-direction: column; }
}
