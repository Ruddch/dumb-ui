import { Link } from 'react-router-dom';
import { ForumLayout } from '../components/layout/ForumLayout';
import { Module } from '../components/layout/Module';
import { ProtocolSidebar } from '../components/layout/ProtocolSidebar';
import { ProtocolDiagram } from '../components/diagram/ProtocolDiagram';
import { env } from '../config/env';
import { TWITTER_URL } from '../lib/links';

export function DocsPage() {
  return (
    <ForumLayout
      breadcrumb={<>You are here: <Link to="/">Home</Link> &gt; <strong>Docs</strong></>}
      sidebar={<ProtocolSidebar />}
    >
      <Module title="★ Protocol docs — DUMB MONEY / NVDA Strategy v2" announce>
        <ol className="rules-list">
          <li>Nothing here is financial advice.</li>
          <li><strong>NVDA Strategy v2</strong> on <strong>Robinhood Chain</strong> (4663). Trade {env.tokenSymbol}/USDG; hook fees power the flywheel below.</li>
          <li>Buy fee starts at 95% and decays −1%/min to 10%. Sell fee is fixed 10%.</li>
          <li>Fee split from hook net: 10% ops · 27% treasury · 63% lot fund.</li>
          <li>Keeper automates executeLot, closePosition, buyback, and stale liquidation (7 days).</li>
          <li>Updates: <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer">@DumbMoneyGroup</a></li>
        </ol>
      </Module>

      <ProtocolDiagram />

      <section className="post-row">
        <div className="vote-col" aria-hidden="true">
          <div className="vote-arrow up" />
          <div className="vote-score">420</div>
          <div className="vote-arrow down" />
        </div>
        <div className="post-body">
          <div className="post-meta">
            <span className="chain-badge">Robinhood Chain · 4663</span>
            &nbsp;·&nbsp; docs · NVDA Strategy v2
          </div>
          <h2 className="post-title">How DUMB MONEY works</h2>
          <div className="post-text">
            <p><strong>Trade:</strong> swap USDG ↔ {env.tokenSymbol} via V4SwapExecutor + StrategyHook.</p>
            <p><strong>Main loop:</strong> swap fees → buy NVDA → open LP → LP converts to 100% USDG at target price → close LP → buyback {env.tokenSymbol} → burn.</p>
            <p><strong>Side path:</strong> 27% of fees → TreasuryV2 → USDG dividends to {env.tokenSymbol} holders (<Link to="/claim">CLAIM</Link> with Merkle proof).</p>
            <p><strong>Lot statuses:</strong> Accumulating → Ready → NvdaPurchased → LPActive → LPConverted → Repositioning → Closed.</p>
          </div>
          <div className="post-footer">
            <span className="num">NVDA Strategy v2</span> &nbsp;·&nbsp; not financial advice
          </div>
        </div>
      </section>

      <Module title="App map">
        <p style={{ fontSize: 'var(--fs-small)' }}>
          <Link to="/swap">SWAP</Link> — trade USDG ↔ {env.tokenSymbol} &nbsp;·&nbsp;
          <Link to="/lots">LOTS</Link> — protocol NVDA positions &nbsp;·&nbsp;
          <Link to="/charts">CHARTS</Link> — pool prices &nbsp;·&nbsp;
          <Link to="/claim">CLAIM</Link> — Treasury dividends
        </p>
      </Module>
    </ForumLayout>
  );
}
