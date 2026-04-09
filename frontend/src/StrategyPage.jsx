import React, { useState } from "react";

// ─── CSS injected once ────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:         #080b10;
    --surface:    #0d1117;
    --surface2:   #161b22;
    --border:     #21262d;
    --border2:    #30363d;
    --blue:       #58a6ff;
    --blue-dim:   #1f6feb;
    --green:      #3fb950;
    --yellow:     #d29922;
    --orange:     #f0883e;
    --red:        #f85149;
    --purple:     #bc8cff;
    --cyan:       #39d353;
    --text:       #e6edf3;
    --text-muted: #8b949e;
    --text-dim:   #484f58;
    --glow-blue:  0 0 24px rgba(88,166,255,0.15);
    --glow-green: 0 0 24px rgba(63,185,80,0.15);
    --font-mono:  'Space Mono', monospace;
    --font-ui:    'Syne', sans-serif;
  }

  body { background: var(--bg); }

  .ssv-page {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-ui);
    background-image:
      radial-gradient(ellipse 80% 40% at 50% -10%, rgba(88,166,255,0.07) 0%, transparent 70%),
      linear-gradient(180deg, transparent 70%, rgba(63,185,80,0.03) 100%);
  }

  .ssv-inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: clamp(24px,5vw,56px) clamp(16px,4vw,32px);
  }

  /* ── Hero ── */
  .hero {
    text-align: center;
    margin-bottom: clamp(40px,8vw,72px);
    position: relative;
  }
  .hero::after {
    content: '';
    display: block;
    width: 200px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--blue-dim), transparent);
    margin: 32px auto 0;
  }
  .hero-badge {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--blue);
    border: 1px solid var(--blue-dim);
    padding: 4px 14px;
    border-radius: 2px;
    margin-bottom: 20px;
    background: rgba(88,166,255,0.06);
  }
  .hero h1 {
    font-size: clamp(28px,6vw,52px);
    font-weight: 800;
    letter-spacing: -1px;
    line-height: 1.1;
    background: linear-gradient(135deg, var(--text) 30%, var(--blue) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 12px;
  }
  .hero p {
    color: var(--text-muted);
    font-size: clamp(14px,3vw,17px);
    font-family: var(--font-mono);
  }

  /* ── Section ── */
  .section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: clamp(20px,4vw,36px);
    margin-bottom: clamp(16px,3vw,24px);
    position: relative;
    overflow: hidden;
  }
  .section::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--accent-top, transparent);
  }
  .section.accent-blue::before  { background: linear-gradient(90deg, var(--blue-dim), transparent); }
  .section.accent-green::before { background: linear-gradient(90deg, var(--green), transparent); }
  .section.accent-orange::before { background: linear-gradient(90deg, var(--orange), transparent); }
  .section.accent-purple::before { background: linear-gradient(90deg, var(--purple), transparent); }
  .section.accent-yellow::before { background: linear-gradient(90deg, var(--yellow), transparent); }
  .section.accent-red::before   { background: linear-gradient(90deg, var(--red), transparent); }

  .section-title {
    font-size: clamp(16px,3.5vw,22px);
    font-weight: 700;
    color: var(--text);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .section-title span.tag {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 400;
    color: var(--text-muted);
    border: 1px solid var(--border2);
    padding: 2px 8px;
    border-radius: 2px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* ── Sub-section ── */
  .sub-section {
    margin-top: 24px;
  }
  .sub-title {
    font-size: clamp(13px,2.5vw,15px);
    font-weight: 600;
    color: var(--blue);
    margin-bottom: 10px;
    font-family: var(--font-mono);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sub-title::before {
    content: '//';
    color: var(--text-dim);
    font-size: 12px;
  }

  /* ── Code block ── */
  .code-block {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: clamp(12px,2.5vw,20px);
    font-family: var(--font-mono);
    font-size: clamp(10px,2vw,12px);
    line-height: 1.8;
    color: var(--text-muted);
    overflow-x: auto;
    white-space: pre;
    tab-size: 2;
  }
  .code-block .kw  { color: var(--purple); }
  .code-block .fn  { color: var(--blue); }
  .code-block .val { color: var(--green); }
  .code-block .cmt { color: var(--text-dim); font-style: italic; }
  .code-block .str { color: var(--orange); }
  .code-block .num { color: var(--cyan); }
  .code-block .hl  { color: var(--yellow); }

  /* ── Table ── */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: clamp(12px,2.5vw,14px);
    overflow: hidden;
    border-radius: 6px;
    border: 1px solid var(--border);
  }
  .data-table th {
    background: var(--surface2);
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: clamp(8px,2vw,12px) clamp(10px,2vw,16px);
    text-align: left;
    border-bottom: 1px solid var(--border2);
  }
  .data-table td {
    padding: clamp(8px,2vw,11px) clamp(10px,2vw,16px);
    border-bottom: 1px solid var(--border);
    color: var(--text-muted);
    vertical-align: top;
  }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr:hover td { background: rgba(255,255,255,0.02); }

  .td-green  { color: var(--green) !important; font-weight: 600; }
  .td-yellow { color: var(--yellow) !important; font-weight: 600; }
  .td-red    { color: var(--red) !important; font-weight: 600; }
  .td-blue   { color: var(--blue) !important; }
  .td-orange { color: var(--orange) !important; }
  .td-purple { color: var(--purple) !important; }
  .td-white  { color: var(--text) !important; font-weight: 600; }

  /* ── Signal indicator ── */
  .signal-row {
    display: flex;
    gap: clamp(10px,2.5vw,16px);
    flex-wrap: wrap;
    margin-top: 16px;
  }
  .signal-card {
    flex: 1;
    min-width: 140px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: clamp(12px,2.5vw,20px);
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .signal-card.bull  { border-color: #1f4d2a; }
  .signal-card.neut  { border-color: #3d3100; }
  .signal-card.bear  { border-color: #4d1f1f; }
  .signal-card .sig-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .signal-card.bull .sig-label { color: var(--green); }
  .signal-card.neut .sig-label { color: var(--yellow); }
  .signal-card.bear .sig-label { color: var(--red); }
  .signal-card .sig-val {
    font-size: clamp(22px,4vw,32px);
    font-weight: 800;
    font-family: var(--font-mono);
    line-height: 1;
    margin-bottom: 6px;
  }
  .signal-card.bull .sig-val { color: var(--green); }
  .signal-card.neut .sig-val { color: var(--yellow); }
  .signal-card.bear .sig-val { color: var(--red); }
  .signal-card .sig-desc {
    font-size: 11px;
    color: var(--text-dim);
    font-family: var(--font-mono);
  }
  .signal-bar {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
  }
  .signal-card.bull .signal-bar { background: var(--green); }
  .signal-card.neut .signal-bar { background: var(--yellow); }
  .signal-card.bear .signal-bar { background: var(--red); }

  /* ── Alloc bars ── */
  .alloc-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 16px;
  }
  .alloc-row {
    display: grid;
    grid-template-columns: 110px 1fr 48px;
    align-items: center;
    gap: 12px;
    font-size: clamp(11px,2.5vw,13px);
    font-family: var(--font-mono);
  }
  .alloc-label { color: var(--text-muted); white-space: nowrap; }
  .alloc-track {
    height: 6px;
    background: var(--surface2);
    border-radius: 3px;
    overflow: hidden;
  }
  .alloc-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.4s ease;
  }
  .alloc-pct { color: var(--text); text-align: right; font-weight: 700; }

  /* ── Tabs ── */
  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px;
    flex-wrap: wrap;
  }
  .tab-btn {
    flex: 1;
    min-width: 80px;
    padding: 8px 14px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: clamp(10px,2vw,12px);
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  .tab-btn:hover { color: var(--text); background: var(--surface2); }
  .tab-btn.active {
    background: var(--surface2);
    color: var(--blue);
    border: 1px solid var(--border2);
  }

  /* ── Info list ── */
  .info-list { list-style: none; line-height: 1.9; }
  .info-list li {
    color: var(--text-muted);
    font-size: clamp(13px,2.5vw,15px);
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .info-list li:last-child { border-bottom: none; }
  .info-list li .li-key {
    color: var(--yellow);
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    min-width: 140px;
    padding-top: 2px;
  }

  /* ── Phase grid ── */
  .phase-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
    gap: clamp(12px,3vw,20px);
    margin-top: 16px;
  }
  .phase-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: clamp(16px,3vw,24px);
  }
  .phase-card h3 {
    font-size: clamp(13px,2.5vw,15px);
    font-weight: 700;
    margin-bottom: 12px;
    font-family: var(--font-mono);
  }
  .phase-card ul { list-style: none; }
  .phase-card ul li {
    font-size: clamp(12px,2.5vw,14px);
    color: var(--text-muted);
    padding: 5px 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 8px;
  }
  .phase-card ul li:last-child { border-bottom: none; }

  /* ── Flow steps ── */
  .flow-steps { margin-top: 12px; }
  .flow-step {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: 12px;
    align-items: flex-start;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
  }
  .flow-step:last-child { border-bottom: none; }
  .step-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid var(--border2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    flex-shrink: 0;
    margin-top: 1px;
  }
  .step-text {
    font-size: clamp(12px,2.5vw,14px);
    color: var(--text-muted);
    line-height: 1.6;
  }
  .step-text strong { color: var(--text); font-weight: 600; }
  .step-text code {
    font-family: var(--font-mono);
    font-size: 11px;
    background: var(--surface2);
    border: 1px solid var(--border);
    padding: 1px 6px;
    border-radius: 3px;
    color: var(--blue);
  }

  /* ── Oracle diagram ── */
  .oracle-flow {
    display: flex;
    align-items: center;
    gap: 0;
    margin-top: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .oracle-node {
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 6px;
    padding: 10px 16px;
    text-align: center;
    font-size: clamp(10px,2vw,12px);
    font-family: var(--font-mono);
    min-width: 100px;
  }
  .oracle-node .on-title { color: var(--text); font-weight: 700; margin-bottom: 2px; }
  .oracle-node .on-sub   { color: var(--text-dim); font-size: 10px; }
  .oracle-arrow {
    font-size: 18px;
    color: var(--text-dim);
    padding: 0 6px;
    flex-shrink: 0;
  }

  /* ── Bonus badge ── */
  .bonus-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%,120px), 1fr));
    gap: 10px;
    margin-top: 14px;
  }
  .bonus-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 14px 10px;
    text-align: center;
  }
  .bonus-card .b-score {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    margin-bottom: 4px;
  }
  .bonus-card .b-val {
    font-size: clamp(18px,3vw,24px);
    font-weight: 800;
    font-family: var(--font-mono);
    color: var(--green);
    margin-bottom: 4px;
  }
  .bonus-card .b-label {
    font-size: 10px;
    color: var(--text-muted);
  }

  /* ── Footer ── */
  .ssv-footer {
    text-align: center;
    padding: clamp(32px,6vw,56px) 0 clamp(16px,4vw,24px);
    border-top: 1px solid var(--border);
    margin-top: clamp(24px,5vw,40px);
  }
  .ssv-footer p { color: var(--text-dim); font-size: 13px; font-family: var(--font-mono); margin-bottom: 16px; }
  .footer-links { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; margin-bottom: 16px; }
  .footer-links a {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 13px;
    font-family: var(--font-mono);
    transition: color 0.15s;
  }
  .footer-links a:hover { color: var(--blue); }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
`;

// ─── Allocation Bar ───────────────────────────────────────────────────────────
const AllocBar = ({ label, pct, color }) => (
  <div className="alloc-row">
    <span className="alloc-label">{label}</span>
    <div className="alloc-track">
      <div className="alloc-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
    <span className="alloc-pct">{pct}%</span>
  </div>
);

// ─── Flow Steps ──────────────────────────────────────────────────────────────
const FlowStep = ({ n, children }) => (
  <div className="flow-step">
    <div className="step-num">{n}</div>
    <div className="step-text">{children}</div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const StrategyPage = () => {
  const [activeFlow, setActiveFlow] = useState("deposit");
  const [activeSignal, setActiveSignal] = useState("bull");

  const allocations = {
    bull: [
      { label: "AlphaVault", pct: 60, color: "#3fb950" },
      { label: "StableCore",  pct: 25, color: "#58a6ff" },
      { label: "RiskGuard",   pct: 15, color: "#f85149" },
    ],
    neut: [
      { label: "AlphaVault", pct: 50, color: "#3fb950" },
      { label: "StableCore",  pct: 30, color: "#58a6ff" },
      { label: "RiskGuard",   pct: 20, color: "#f85149" },
    ],
    bear: [
      { label: "AlphaVault", pct: 30, color: "#3fb950" },
      { label: "StableCore",  pct: 30, color: "#58a6ff" },
      { label: "RiskGuard",   pct: 40, color: "#f85149" },
    ],
  };

  const flows = {
    deposit: [
      { n: 1, content: <><strong>onlyVerified</strong> check — NexaID gate passes (or <code>nexaid == address(0)</code>)</> },
      { n: 2, content: <><code>usdc.transferFrom(msg.sender, address(this), amount)</code> — balance verified pre/post</> },
      { n: 3, content: <><code>balances[msg.sender] += amount</code> · <code>totalDeposits += amount</code></> },
      { n: 4, content: <><code>_allocate(amount)</code> — reads live DEX signal → distributes across 3 buckets</> },
      { n: 5, content: <><code>_addXP(msg.sender, 10)</code> — may trigger <code>LevelUp</code> event</> },
      { n: 6, content: <><strong>emit</strong> <code>Deposited</code> + <code>Rebalanced</code> (from allocate)</> },
    ],
    harvest: [
      { n: 1, content: <>Checks: <code>totalYield &gt; 0</code> · <code>totalDeposits &gt; 0</code> · <code>block.timestamp &gt;= lastHarvest + 60s</code></> },
      { n: 2, content: <><code>userShare = (balances[user] × 1e18) / totalDeposits</code></> },
      { n: 3, content: <><code>gross = (totalYield × userShare) / 1e18</code></> },
      { n: 4, content: <><code>fee = (gross × performanceFee) / 100</code> → goes to <code>rewards[owner]</code></> },
      { n: 5, content: <><code>netReward = gross − fee</code> → boosted by <code>_getLevelBonus()</code> (level × 5%, max 50%)</> },
      { n: 6, content: <>NexaID score bonus applied: <code>score &gt; 800</code> → +20%, <code>&gt; 500</code> → +10%, <code>&gt; 300</code> → +5%</> },
      { n: 7, content: <><code>totalYield -= gross</code> · <code>rewards[user] += finalReward</code> · XP +25</> },
    ],
    claim: [
      { n: 1, content: <><code>reward = rewards[msg.sender]</code> — must be <code>&gt; 0</code></> },
      { n: 2, content: <>Vault USDC balance check: <code>balanceOf(this) &gt;= reward</code></> },
      { n: 3, content: <><code>rewards[msg.sender] = 0</code> — zeroed BEFORE transfer (CEI pattern)</> },
      { n: 4, content: <><code>usdc.transfer(msg.sender, reward)</code></> },
      { n: 5, content: <><code>_addXP(msg.sender, 15)</code></> },
    ],
    rebalance: [
      { n: 1, content: <>Anyone can call — no keeper required</> },
      { n: 2, content: <><code>signal = _getSignal()</code> — reads DEX oracle or manual keeper value</> },
      { n: 3, content: <>Recalculates <code>alphaVault</code>, <code>stableCore</code>, <code>riskGuard</code> based on signal tier</> },
      { n: 4, content: <><code>bounty = (totalDeposits × rebalanceBounty) / 10000</code> (default 0.05%)</> },
      { n: 5, content: <><code>usdc.transfer(msg.sender, bounty)</code> + <code>bountiesEarned[msg.sender] += bounty</code></> },
      { n: 6, content: <><code>_addXP(msg.sender, 20)</code> · <strong>emit</strong> <code>Rebalanced</code> + <code>BountyPaid</code></> },
    ],
    withdraw: [
      { n: 1, content: <><strong>onlyVerified</strong> + <strong>notPaused</strong> + <strong>nonReentrant</strong> guards</> },
      { n: 2, content: <><code>balances[user] &gt;= amount</code> AND <code>vault USDC balance &gt;= amount</code></> },
      { n: 3, content: <><code>balances[user] -= amount</code> · <code>totalDeposits -= amount</code></> },
      { n: 4, content: <><code>usdc.transfer(msg.sender, amount)</code></> },
      { n: 5, content: <><code>_addXP(msg.sender, 5)</code> · <strong>emit</strong> <code>Withdrawn</code></> },
    ],
  };

  const flowLabels = {
    deposit:   "💰 Deposit",
    harvest:   "🌾 Harvest",
    claim:     "🎁 Claim",
    rebalance: "🔄 Rebalance",
    withdraw:  "📤 Withdraw",
  };

  const signalData = {
    bull: { label: "BULLISH", val: "80", desc: "price > 3000 USDC", color: "#3fb950" },
    mid_bull: { label: "MID-BULL", val: "65", desc: "price > midpoint", color: "#58a6ff" },
    neutral: { label: "NEUTRAL", val: "50", desc: "price at midpoint", color: "#d29922" },
    mid_bear: { label: "MID-BEAR", val: "40", desc: "price < midpoint", color: "#f0883e" },
    bear: { label: "BEARISH", val: "30", desc: "price < 2000 USDC", color: "#f85149" },
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="ssv-page">
        <div className="ssv-inner">

          {/* ── Hero ── */}
          <div className="hero">
            <div className="hero-badge">Technical Documentation</div>
            <h1>🔥 Sentient Shield Vault</h1>
            <p>Strategy Engine · Oracle · Gamification · Security</p>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              1. DEX ORACLE & SIGNAL ENGINE
          ══════════════════════════════════════════════════════════════════ */}
          <div className="section accent-blue">
            <h2 className="section-title">
              🔮 DEX Oracle & Signal Engine
              <span className="tag">On-Chain</span>
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "clamp(13px,2.5vw,15px)", lineHeight: 1.7, marginBottom: 20 }}>
              The signal engine is fully on-chain. It reads price from a Uniswap V2-compatible pair
              (<code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--blue)", background: "var(--surface2)", padding: "1px 6px", borderRadius: 3 }}>MockPair.sol</code>),
              validates against flash-loan bounds, and maps the price to an allocation signal (0–100).
              No hardcoded values — the signal updates every block.
            </p>

            {/* Oracle flow diagram */}
            <div className="oracle-flow">
              <div className="oracle-node">
                <div className="on-title">MockPair</div>
                <div className="on-sub">getReserves()</div>
              </div>
              <div className="oracle-arrow">→</div>
              <div className="oracle-node">
                <div className="on-title">getPrice()</div>
                <div className="on-sub">VaultOracle.sol</div>
              </div>
              <div className="oracle-arrow">→</div>
              <div className="oracle-node">
                <div className="on-title">Bounds Check</div>
                <div className="on-sub">1000–10000 USDC</div>
              </div>
              <div className="oracle-arrow">→</div>
              <div className="oracle-node">
                <div className="on-title">getSignalFromDEX()</div>
                <div className="on-sub">0–100 output</div>
              </div>
              <div className="oracle-arrow">→</div>
              <div className="oracle-node">
                <div className="on-title">_allocate()</div>
                <div className="on-sub">Vault.sol</div>
              </div>
            </div>

            <div className="sub-section">
              <div className="sub-title">getPrice() — VaultOracle.sol</div>
              <div className="code-block">
<span className="cmt">// Reads live price from Uniswap V2-compatible pair</span>
<span className="kw">function</span> <span className="fn">getPrice</span>() <span className="kw">public view returns</span> (<span className="kw">uint</span>) {"{"}
  (uint112 r0, uint112 r1, ) = IUniswapV2Pair(pair).getReserves();
  require(r0 &gt; 0 &amp;&amp; r1 &gt; 0, <span className="str">"Invalid reserves"</span>);

  address token0 = IUniswapV2Pair(pair).token0();
  <span className="kw">uint</span> price;

  <span className="kw">if</span> (token0 == address(usdc))
    price = (<span className="kw">uint</span>(r0) * PRICE_DECIMALS) / <span className="kw">uint</span>(r1); <span className="cmt">// r0/r1 = USDC per token</span>
  <span className="kw">else</span>
    price = (<span className="kw">uint</span>(r1) * PRICE_DECIMALS) / <span className="kw">uint</span>(r0);

  <span className="cmt">// 🛡️ Flash-loan protection — anomalous prices revert</span>
  require(price &gt;= minValidPrice &amp;&amp; price &lt;= maxValidPrice,
    <span className="str">"Price anomaly detected - possible flash loan attack"</span>);

  <span className="kw">return</span> price;
{"}"}</div>
            </div>

            <div className="sub-section">
              <div className="sub-title">getSignalFromDEX() — 5-tier mapping</div>
              <div className="code-block">
<span className="cmt">// Converts raw price → allocation signal (0-100)</span>
<span className="cmt">// Default: bullishThreshold = 3000e18 · bearishThreshold = 2000e18</span>
<span className="cmt">//          mid = (3000 + 2000) / 2 = 2500</span>

<span className="kw">if</span>      (price &gt; bullishThreshold)            <span className="kw">return</span> <span className="num">80</span>; <span className="cmt">// &gt; 3000 → BULL</span>
<span className="kw">else if</span> (price &gt; mid)                         <span className="kw">return</span> <span className="num">65</span>; <span className="cmt">// 2500-3000 → MID-BULL</span>
<span className="kw">else if</span> (price == mid)                        <span className="kw">return</span> <span className="num">50</span>; <span className="cmt">// = 2500 → NEUTRAL</span>
<span className="kw">else if</span> (price &gt; bearishThreshold)            <span className="kw">return</span> <span className="num">40</span>; <span className="cmt">// 2000-2500 → MID-BEAR</span>
<span className="kw">else</span>                                          <span className="kw">return</span> <span className="num">30</span>; <span className="cmt">// &lt; 2000 → BEAR</span>

<span className="cmt">// Fallback: if getPrice() reverts → returns manual marketSignal</span>
<span className="cmt">// Owner can toggle: setUseDEXSignal(false) → keepers set manual signal</span></div>
            </div>

            <div className="sub-section">
              <div className="sub-title">Live Signal Values</div>
              <div className="signal-row">
                {Object.entries(signalData).map(([k, s]) => (
                  <div key={k} className="signal-card" style={{ borderColor: s.color + "44" }}>
                    <div className="sig-label" style={{ color: s.color }}>{s.label}</div>
                    <div className="sig-val" style={{ color: s.color }}>{s.val}</div>
                    <div className="sig-desc">{s.desc}</div>
                    <div className="signal-bar" style={{ background: s.color }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="sub-section">
              <div className="sub-title">Admin Controls — VaultOracle.sol</div>
              <table className="data-table" style={{ marginTop: 4 }}>
                <thead><tr>
                  <th>Function</th><th>Access</th><th>Description</th>
                </tr></thead>
                <tbody>
                  <tr><td className="td-blue"><code>setUseDEXSignal(bool)</code></td><td>Owner</td><td>Toggle DEX vs manual signal mode</td></tr>
                  <tr><td className="td-blue"><code>setPair(address)</code></td><td>Owner</td><td>Update the price oracle pair contract</td></tr>
                  <tr><td className="td-blue"><code>setThresholds(bull, bear)</code></td><td>Owner</td><td>Adjust bullish/bearish price thresholds</td></tr>
                  <tr><td className="td-blue"><code>setPriceBounds(min, max)</code></td><td>Owner</td><td>Set flash-loan protection bounds</td></tr>
                  <tr><td className="td-blue"><code>setKeeper(address, bool)</code></td><td>Owner</td><td>Whitelist keeper for manual signal updates</td></tr>
                  <tr><td className="td-blue"><code>setSignal(uint)</code></td><td>Keeper</td><td>Manual signal (only when DEX mode is off)</td></tr>
                  <tr><td className="td-blue"><code>getCurrentSignal()</code></td><td>Public</td><td>Returns active signal (DEX or manual)</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              2. DYNAMIC ALLOCATION
          ══════════════════════════════════════════════════════════════════ */}
          <div className="section accent-green">
            <h2 className="section-title">
              📊 Dynamic Allocation Engine
              <span className="tag">Strategy</span>
            </h2>

            <div className="tabs">
              {["bull","neut","bear"].map(k => (
                <button
                  key={k}
                  className={`tab-btn ${activeSignal === k ? "active" : ""}`}
                  onClick={() => setActiveSignal(k)}
                >
                  {k === "bull" ? "🟢 Bull  >70" : k === "neut" ? "🟡 Neutral 40–70" : "🔴 Bear  <40"}
                </button>
              ))}
            </div>

            <div className="alloc-grid">
              {allocations[activeSignal].map(a => (
                <AllocBar key={a.label} {...a} />
              ))}
            </div>

            <div style={{ marginTop: 20, overflowX: "auto" }}>
              <table className="data-table">
                <thead><tr>
                  <th>Bucket</th><th>Role</th>
                  <th className="td-green">Bull &gt;70</th>
                  <th className="td-yellow">Neutral</th>
                  <th className="td-red">Bear &lt;40</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td className="td-white">AlphaVault</td>
                    <td>High-yield / aggressive</td>
                    <td className="td-green">60%</td>
                    <td className="td-yellow">50%</td>
                    <td className="td-red">30%</td>
                  </tr>
                  <tr>
                    <td className="td-white">StableCore</td>
                    <td>Low-risk / stable yield</td>
                    <td className="td-green">25%</td>
                    <td className="td-yellow">30%</td>
                    <td className="td-red">30%</td>
                  </tr>
                  <tr>
                    <td className="td-white">RiskGuard</td>
                    <td>Hedge / downside cover</td>
                    <td className="td-green">15%</td>
                    <td className="td-yellow">20%</td>
                    <td className="td-red">40%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="sub-section">
              <div className="sub-title">Future Signal Formula (Phase 2)</div>
              <div className="code-block">
<span className="cmt">// Chainlink + Pyth integration planned</span>
Signal = (<span className="num">0.4</span> × Volatility_EWMA)
       + (<span className="num">0.3</span> × CDP_Health_Factor)
       + (<span className="num">0.3</span> × Funding_Rate_Delta)

<span className="cmt">// Output tiers (same as current):</span>
<span className="num">0</span>–<span className="num">40</span>  → Bear  → RiskGuard  +15%
<span className="num">40</span>–<span className="num">70</span> → Neutral → no change
<span className="num">70</span>–<span className="num">100</span> → Bull → AlphaVault +10%</div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              3. TRANSACTION FLOWS
          ══════════════════════════════════════════════════════════════════ */}
          <div className="section accent-purple">
            <h2 className="section-title">
              🔄 Transaction Flows
              <span className="tag">Execution</span>
            </h2>

            <div className="tabs">
              {Object.entries(flowLabels).map(([k, v]) => (
                <button
                  key={k}
                  className={`tab-btn ${activeFlow === k ? "active" : ""}`}
                  onClick={() => setActiveFlow(k)}
                >{v}</button>
              ))}
            </div>

            <div className="flow-steps">
              {flows[activeFlow].map(step => (
                <FlowStep key={step.n} n={step.n}>{step.content}</FlowStep>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              4. GAMIFICATION
          ══════════════════════════════════════════════════════════════════ */}
          <div className="section accent-yellow">
            <h2 className="section-title">
              🎮 Gamification System
              <span className="tag">XP · Levels · Bonuses</span>
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,300px),1fr))", gap: 20 }}>
              <div>
                <div className="sub-title">XP per Action</div>
                <table className="data-table">
                  <thead><tr><th>Action</th><th>XP</th></tr></thead>
                  <tbody>
                    {[["Deposit","+10"],["Harvest","+25"],["Claim","+15"],["Rebalance","+20"],["Withdraw","+5"]].map(([a,x]) => (
                      <tr key={a}><td>{a}</td><td className="td-green">{x} XP</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <div className="sub-title">Level → Harvest Bonus</div>
                <table className="data-table">
                  <thead><tr><th>Level</th><th>XP Required</th><th>Bonus</th></tr></thead>
                  <tbody>
                    {[["1","0–99","+5%"],["2","100–299","+10%"],["3","300–599","+15%"],
                      ["4","600–999","+20%"],["5","1000–1499","+25%"],["10+","5000+","+50% max"]].map(([l,x,b]) => (
                      <tr key={l}><td className="td-white">{l}</td><td>{x}</td><td className="td-green">{b}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="sub-section">
              <div className="sub-title">Level Bonus Formula (on-chain)</div>
              <div className="code-block">
<span className="cmt">// VaultBase.sol — _getLevelBonus()</span>
<span className="kw">function</span> <span className="fn">_getLevelBonus</span>(address user) <span className="kw">internal view returns</span> (<span className="kw">uint</span>) {"{"}
  <span className="kw">uint</span> bonus = level[user] * <span className="num">5</span>;      <span className="cmt">// 5% per level</span>
  <span className="kw">return</span> bonus &gt; maxLevelBonus ? maxLevelBonus : bonus;
                                        <span className="cmt">// default cap: 50%</span>
{"}"}</div>
            </div>

            <div className="sub-section">
              <div className="sub-title">Future Gamification Upgrades</div>
              <ul className="info-list">
                {[
                  ["Fee Discounts","Higher level users pay lower performance fees"],
                  ["Soulbound NFTs","Unique badge minted on each level-up event"],
                  ["Priority Withdrawals","High-level users get faster processing"],
                  ["Governance Power","Level-weighted voting in DAO proposals"],
                  ["Exclusive Vaults","Early access to new strategy vaults"],
                  ["Monthly Leaderboard","Bonus pool for top XP earners"],
                ].map(([k,v]) => (
                  <li key={k}><span className="li-key">{k}</span><span>{v}</span></li>
                ))}
              </ul>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              5. NEXAID IDENTITY
          ══════════════════════════════════════════════════════════════════ */}
          <div className="section accent-orange">
            <h2 className="section-title">
              🔐 NexaID Identity Layer
              <span className="tag">MockNexaID.sol</span>
            </h2>

            <p style={{ color: "var(--text-muted)", fontSize: "clamp(13px,2.5vw,15px)", lineHeight: 1.7, marginBottom: 16 }}>
              On-chain identity and reputation system. Users must call <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--blue)", background: "var(--surface2)", padding: "1px 6px", borderRadius: 3 }}>verifyMe()</code> or <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--blue)", background: "var(--surface2)", padding: "1px 6px", borderRadius: 3 }}>selfVerify(score)</code> before interacting with the vault. Score determines harvest reward boost.
            </p>

            <div className="bonus-grid">
              {[
                { score: "score > 800", val: "+20%", label: "Elite Reputation" },
                { score: "score > 500", val: "+10%", label: "Trusted User" },
                { score: "score > 300", val: "+5%",  label: "Verified User" },
                { score: "score ≤ 300", val: "+0%",  label: "Basic Verified" },
              ].map(b => (
                <div className="bonus-card" key={b.score}>
                  <div className="b-score">{b.score}</div>
                  <div className="b-val" style={{ color: b.val === "+0%" ? "var(--text-dim)" : "var(--green)" }}>{b.val}</div>
                  <div className="b-label">{b.label}</div>
                </div>
              ))}
            </div>

            <div className="sub-section">
              <div className="sub-title">Contract Interface</div>
              <div className="code-block">
<span className="cmt">// MockNexaID.sol — deployed at 0x83660B2dc4C917558CAc56b24EeF98A1524D0bAE</span>

<span className="fn">verifyMe</span>()                    <span className="cmt">// self-verify with default score 750</span>
<span className="fn">selfVerify</span>(<span className="kw">uint</span> score)         <span className="cmt">// self-verify with custom score (100–1000)</span>
<span className="fn">setUser</span>(addr, <span className="kw">bool</span>, <span className="kw">uint</span>)   <span className="cmt">// owner: set any user's status + score</span>
<span className="fn">verify</span>(address) → <span className="kw">bool</span>       <span className="cmt">// check if verified</span>
<span className="fn">getScore</span>(address) → <span className="kw">uint</span>    <span className="cmt">// get reputation score</span>
<span className="fn">getUserStatus</span>(address)       <span className="cmt">// returns (bool verified, uint score)</span>
<span className="fn">resetUser</span>(address)           <span className="cmt">// owner emergency reset</span></div>
            </div>

            <div className="sub-section">
              <div className="sub-title">Vault Integration (onlyVerified modifier)</div>
              <div className="code-block">
<span className="kw">modifier</span> <span className="fn">onlyVerified</span>() {"{"}
  <span className="kw">if</span> (address(nexaid) != address(<span className="num">0</span>)) {"{"}
    require(nexaid.verify(msg.sender), <span className="str">"NexaID: Identity not verified"</span>);
  {"}"}
  _;    <span className="cmt">// if nexaid == address(0), gate is open for all</span>
{"}"}</div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              6. SECURITY
          ══════════════════════════════════════════════════════════════════ */}
          <div className="section accent-red">
            <h2 className="section-title">
              🛡️ Security Infrastructure
              <span className="tag">On-Chain + Frontend</span>
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,300px),1fr))", gap: 20 }}>
              <div>
                <div className="sub-title">On-Chain Guards</div>
                <ul className="info-list">
                  {[
                    ["nonReentrant","locked bool — CEI pattern enforced"],
                    ["notPaused","owner can halt all ops in emergency"],
                    ["onlyVerified","NexaID gate on deposit + withdraw"],
                    ["Price Bounds","min/maxValidPrice revert anomalous DEX prices"],
                    ["Harvest Cooldown","60s enforced on-chain per user"],
                    ["Fee Cap","performanceFee ≤ 50%, bounty ≤ 1%"],
                    ["Signal Cooldown","keeper signal updates need 60s gap"],
                  ].map(([k,v]) => (
                    <li key={k}><span className="li-key">{k}</span><span>{v}</span></li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="sub-title">ShieldBot (Frontend)</div>
                <div className="code-block" style={{ fontSize: "clamp(9px,1.8vw,11px)" }}>
<span className="cmt">// Pre-transaction risk scoring</span>
<span className="cmt">// Runs before deposit / withdraw / harvest</span>

Score &lt; <span className="num">30</span>  → <span className="val">ALLOW</span>   (safe)
Score <span className="num">30</span>–<span className="num">70</span> → <span className="hl">WARN</span>    (user confirms)
Score &gt; <span className="num">70</span>  → <span className="str">BLOCK</span>   (tx rejected)

<span className="cmt">// Production upgrade: real mempool analysis</span>
<span className="cmt">// sandwich detection, honeypot check, simulation</span></div>

                <div className="sub-title" style={{ marginTop: 16 }}>Emergency Functions</div>
                <div className="code-block" style={{ fontSize: "clamp(9px,1.8vw,11px)" }}>
<span className="cmt">// Owner only</span>
<span className="fn">pause</span>()                   <span className="cmt">// halt all operations</span>
<span className="fn">unpause</span>()                 <span className="cmt">// resume</span>
<span className="fn">emergencyWithdraw</span>(token, amt) <span className="cmt">// recover any ERC-20 or ETH</span></div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              7. ECONOMIC MODEL
          ══════════════════════════════════════════════════════════════════ */}
          <div className="section accent-blue">
            <h2 className="section-title">
              💰 Economic Model
              <span className="tag">Fees · Incentives</span>
            </h2>

            <table className="data-table">
              <thead><tr>
                <th>Source</th><th>Rate</th><th>Recipient</th><th>Configurable</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td className="td-white">Performance Fee</td>
                  <td className="td-yellow">10% of gross harvest</td>
                  <td>Protocol Treasury (owner)</td>
                  <td className="td-blue">Yes, max 50%</td>
                </tr>
                <tr>
                  <td className="td-white">Rebalance Bounty</td>
                  <td className="td-green">0.05% of totalDeposits</td>
                  <td>Rebalance caller (anyone)</td>
                  <td className="td-blue">Yes, max 1%</td>
                </tr>
                <tr>
                  <td className="td-white">Level Bonus</td>
                  <td className="td-green">+5% per level (max 50%)</td>
                  <td>User (applied to netReward)</td>
                  <td className="td-blue">maxLevelBonus settable</td>
                </tr>
                <tr>
                  <td className="td-white">NexaID Bonus</td>
                  <td className="td-green">+5% to +20%</td>
                  <td>User (score-based)</td>
                  <td className="td-blue">Score thresholds fixed</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              8. CONTRACT ARCHITECTURE
          ══════════════════════════════════════════════════════════════════ */}
          <div className="section accent-purple">
            <h2 className="section-title">
              🏗️ Contract Architecture
              <span className="tag">Solidity 0.8.24</span>
            </h2>

            <div className="code-block">
<span className="cmt">// Inheritance chain — deploy only Vault.sol</span>

VaultBase.sol          <span className="cmt">← storage, events, modifiers, XP/level logic</span>
  └── VaultOracle.sol  <span className="cmt">← DEX oracle, signal engine, keeper management</span>
        └── Vault.sol  <span className="cmt">← deposit, withdraw, harvest, claim, rebalance ✅ DEPLOY THIS</span>

<span className="cmt">// Supporting contracts (deploy separately):</span>
MockUSDC.sol           <span className="str">0xfD36e42d57DdEF313457FFf750fEd831958E5cd2</span>
MockNexaID.sol         <span className="str">0x83660B2dc4C917558CAc56b24EeF98A1524D0bAE</span>
MockPair.sol           <span className="str">0xB6Ab09336698DE498966bD5b522adD93C7CB78da</span>
Vault.sol              <span className="str">0x48CBAD88B6df3D0510a45A5A10c0577CA6C037D4</span>

<span className="cmt">// Network: HashKey Testnet | Chain ID: 133 | RPC: https://testnet.hsk.xyz</span></div>

            <div className="sub-section">
              <div className="sub-title">Key State Variables</div>
              <table className="data-table">
                <thead><tr><th>Variable</th><th>Type</th><th>Description</th></tr></thead>
                <tbody>
                  {[
                    ["balances","mapping(address→uint)","User deposit amounts"],
                    ["rewards","mapping(address→uint)","Pending claimable rewards"],
                    ["xp / level","mapping(address→uint)","Gamification state"],
                    ["totalDeposits","uint","Sum of all active deposits"],
                    ["totalYield","uint","Available yield pool"],
                    ["alphaVault/stableCore/riskGuard","uint","Strategy bucket amounts"],
                    ["useDEXSignal","bool","DEX oracle vs manual mode"],
                    ["bullishThreshold/bearishThreshold","uint","Price signal thresholds"],
                    ["minValidPrice/maxValidPrice","uint","Flash-loan protection bounds"],
                  ].map(([v,t,d]) => (
                    <tr key={v}><td className="td-blue"><code>{v}</code></td><td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{t}</td><td>{d}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              9. ROADMAP
          ══════════════════════════════════════════════════════════════════ */}
          <div className="section accent-green">
            <h2 className="section-title">🚀 Roadmap</h2>
            <div className="phase-grid">
              <div className="phase-card">
                <h3 style={{ color: "var(--green)" }}>Phase 1 — MVP ✅</h3>
                <ul>
                  {["Core vault mechanics","DEX price oracle (on-chain)","Dynamic allocation engine","XP / Level system","Keeperless rebalance + bounty","NexaID identity layer","ShieldBot frontend guard","Telegram bot control layer"].map(i => (
                    <li key={i}><span style={{ color: "var(--green)" }}>✓</span><span>{i}</span></li>
                  ))}
                </ul>
              </div>
              <div className="phase-card">
                <h3 style={{ color: "var(--yellow)" }}>Phase 2 — Coming</h3>
                <ul>
                  {["Chainlink / Pyth oracle","Real yield (Aave, Compound)","DAO governance","Fee discounts per level","Soulbound NFT badges","Advanced signal formula"].map(i => (
                    <li key={i}><span style={{ color: "var(--text-dim)" }}>○</span><span>{i}</span></li>
                  ))}
                </ul>
              </div>
              <div className="phase-card">
                <h3 style={{ color: "var(--blue)" }}>Phase 3 — Vision</h3>
                <ul>
                  {["DeFi OS layer","Institutional vaults","Real AI signal engine","Cross-chain expansion","Automated risk management","Cross-protocol arbitrage"].map(i => (
                    <li key={i}><span style={{ color: "var(--text-dim)" }}>◇</span><span>{i}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="ssv-footer">
            <p>🔥 Sentient Shield Vault — DeFi that doesn't wait, it acts.</p>
            <div className="footer-links">
              <a href="https://github.com/Outlier1217/sentient-shield-vault" target="_blank" rel="noopener noreferrer">📦 GitHub</a>
              <a href="https://t.me/ssv_defi_bot" target="_blank" rel="noopener noreferrer">🤖 Telegram Bot</a>
              <a href="https://youtu.be/VxmpqMxuk7E" target="_blank" rel="noopener noreferrer">📺 Demo Video</a>
              <a href="https://mprot.store/" target="_blank" rel="noopener noreferrer">🌐 Live Prototype</a>
            </div>
            <p style={{ fontSize: 11 }}>Built on HashKey Chain · Powered by NexaID · Secured by ShieldBot</p>
          </div>

        </div>
      </div>
    </>
  );
};

export default StrategyPage;