import { Link } from 'react-router-dom';
import { ForumLayout } from '../components/layout/ForumLayout';
import { Module, StatRow } from '../components/layout/Module';
import { ProtocolDiagram } from '../components/diagram/ProtocolDiagram';
import { env } from '../config/env';
import { TWITTER_URL } from '../lib/links';

function shortAddr(addr: string | undefined | '') {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const EXPLORER = 'https://robinhoodchain.blockscout.com';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function ExplorerAddr({ address = ZERO_ADDRESS }: { address?: string }) {
  const addr = address || ZERO_ADDRESS;
  const label = addr === ZERO_ADDRESS ? addr : shortAddr(addr);
  return (
    <a
      href={`${EXPLORER}/address/${addr}`}
      target="_blank"
      rel="noopener noreferrer"
      className="docs-addr"
    >
      {label}
    </a>
  );
}

function DocsToc() {
  return (
    <>
      <Module title="Table of contents">
        <nav className="docs-toc">
          <a href="#overview">1. Overview</a>
          <a href="#users">2. For users</a>
          <a href="#flywheel">3. The loop</a>
          <a href="#fees">4. Fees &amp; splits</a>
          <a href="#lots">5. Lots &amp; LP</a>
          <a href="#dividends">6. Dividends</a>
          <a href="#buyback">7. Buyback &amp; burn</a>
          <a href="#automation">8. Automation</a>
          <a href="#contracts">9. Contracts</a>
          <a href="#network">10. Network</a>
          <a href="#app">11. App map</a>
        </nav>
      </Module>
      <Module title="Quick links">
        <p style={{ fontSize: 'var(--fs-small)' }}><Link to="/swap">→ Swap desk</Link></p>
        <p style={{ fontSize: 'var(--fs-small)', marginTop: 4 }}><Link to="/lots">→ Protocol lots</Link></p>
        <p style={{ fontSize: 'var(--fs-small)', marginTop: 4 }}><Link to="/claim">→ Claim dividends</Link></p>
        <p style={{ fontSize: 'var(--fs-small)', marginTop: 4 }}>
          <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer">→ @DumbMoneyGroup</a>
        </p>
      </Module>
    </>
  );
}

export function DocsPage() {
  const S = env.tokenSymbol;

  return (
    <ForumLayout
      breadcrumb={<>You are here: <Link to="/">Home</Link> &gt; <strong>Docs</strong></>}
      sidebar={<DocsToc />}
    >
      <Module title={`★ Protocol docs — DUMB MONEY / ${S}`} announce>
        <ol className="rules-list">
          <li>Nothing here is financial advice. DYOR.</li>
          <li>
            <strong>{S}</strong> is a strategy token on <strong>Robinhood Chain</strong>.
            You trade {S}/USDG; trading fees buy tokenized NVDA, run LP, pay NVDA dividends, and burn {S}.
          </li>
          <li>
            Updates: <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer">@DumbMoneyGroup</a>
          </li>
        </ol>
      </Module>

      {/* ── 1. Overview ── */}
      <section className="post-row" id="overview">
        <div className="vote-col" aria-hidden="true">
          <div className="vote-arrow up" />
          <div className="vote-score">01</div>
          <div className="vote-arrow down" />
        </div>
        <div className="post-body">
          <div className="post-meta">
            <span className="chain-badge">Robinhood · {env.chainId}</span>
            &nbsp;·&nbsp; docs · overview
          </div>
          <h2 className="post-title">What is {S}?</h2>
          <div className="post-text docs-prose">
            <p>
              <strong>{S}</strong> is a tokenized NVDA strategy token. There is <strong>no vault deposit</strong>.
              You only swap {S} ↔ USDG. Every trade pays a fee; that fee fuels the protocol.
            </p>
            <p>
              Fees accumulate into <strong>lots</strong>. When a lot is full, the protocol buys NVDA,
              puts most of it into an LP band below the current price, and sends a share to the dividend pool.
              When that LP fully converts to USDG, the protocol buys {S} and burns it.
            </p>
            <p>
              Net effect: trading → NVDA exposure + NVDA dividends for {S} holders → continuous {S} burn.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. Users ── */}
      <Module title="2. For users">
        <div id="users" className="docs-anchor" />
        <div className="docs-prose">
          <h3>What you can do</h3>
          <table className="lots-table docs-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Where</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Buy / sell {S}</td>
                <td><Link to="/swap">SWAP</Link></td>
                <td>Trade USDG ↔ {S} on Robinhood Chain</td>
              </tr>
              <tr>
                <td>Watch protocol lots</td>
                <td><Link to="/lots">LOTS</Link></td>
                <td>See open and closed NVDA positions run by the protocol</td>
              </tr>
              <tr>
                <td>Claim NVDA dividends</td>
                <td><Link to="/claim">CLAIM</Link></td>
                <td>Payout is in <strong>NVDA</strong>, when an epoch is open for claims</td>
              </tr>
            </tbody>
          </table>

          <h3>Wallet &amp; network</h3>
          <p>
            Connect MetaMask / Rabby on <strong>Robinhood Chain ({env.chainId})</strong>.
            The app will ask you to switch network if needed.
          </p>
        </div>
      </Module>

      {/* ── 3. Flywheel ── */}
      <div id="flywheel" className="docs-anchor" />
      <ProtocolDiagram />

      <Module title="3. The loop — step by step">
        <div className="docs-prose">
          <ol className="rules-list">
            <li>Someone swaps USDG ↔ {S}. The trade pays a fee.</li>
            <li>That fee (in USDG) goes into the next lot.</li>
            <li>When a lot is full enough, it becomes <strong>Ready</strong>.</li>
            <li>The keeper buys NVDA with that USDG: 80% into LP, 20% into the dividend pool.</li>
            <li>The LP holds NVDA in a narrow band <em>below</em> the current price.</li>
            <li>As NVDA price moves through that band, the position turns into USDG.</li>
            <li>When it is fully converted, the keeper closes it and sends the USDG to buyback.</li>
            <li>Buyback swaps USDG → {S} and <strong>burns</strong> it.</li>
          </ol>
        </div>
      </Module>

      {/* ── 4. Fees ── */}
      <Module title="4. Fees &amp; splits">
        <div id="fees" className="docs-anchor" />
        <div className="docs-prose">
          <h3>Trading fees</h3>
          <table className="lots-table docs-table">
            <thead>
              <tr><th>Fee</th><th>Default</th><th>Notes</th></tr>
            </thead>
            <tbody>
              <tr><td>Buy fee</td><td>10%</td><td>Paid when buying {S}</td></tr>
              <tr><td>Sell fee</td><td>10%</td><td>Paid when selling {S}</td></tr>
              <tr><td>Pool fee</td><td>0.3%</td><td>Normal Uniswap pool fee on top</td></tr>
            </tbody>
          </table>
          <p>
            Live buy/sell fees are shown in the sidebar and on the swap desk.
          </p>

          <h3>After the protocol buys NVDA</h3>
          <table className="lots-table docs-table">
            <thead>
              <tr><th>Share</th><th>Goes to</th></tr>
            </thead>
            <tbody>
              <tr><td>80%</td><td>NVDA LP (later converts → buyback &amp; burn)</td></tr>
              <tr><td>20%</td><td>Dividend pool (NVDA paid to {S} holders)</td></tr>
            </tbody>
          </table>
        </div>
      </Module>

      {/* ── 5. Lots ── */}
      <Module title="5. Lots &amp; LP">
        <div id="lots" className="docs-anchor" />
        <div className="docs-prose">
          <h3>Lot statuses</h3>
          <table className="lots-table docs-table">
            <thead>
              <tr><th>Status</th><th>Meaning</th></tr>
            </thead>
            <tbody>
              <tr><td>Accumulating</td><td>Collecting fees until the lot is full</td></tr>
              <tr><td>Ready</td><td>Full; waiting for the keeper to buy NVDA</td></tr>
              <tr><td>NvdaPurchased</td><td>Short step while NVDA is bought and split</td></tr>
              <tr><td>LPActive</td><td>NVDA is sitting in the LP band</td></tr>
              <tr><td>Closed</td><td>Done — USDG went to buyback</td></tr>
            </tbody>
          </table>
          <p>
            The <Link to="/lots">lots page</Link> shows open lots (Ready / LPActive) and a closed history.
            The progress bar shows how close the current NVDA price is to the exit of the band.
          </p>

          <h3>How the LP works</h3>
          <ul>
            <li>NVDA is placed in a band <strong>below</strong> the current market price.</li>
            <li>The band is narrow — about <strong>~3.7%</strong> wide by default.</li>
            <li>When price moves through the band, the position becomes 100% USDG and can be closed.</li>
          </ul>

          <h3>Stale liquidation</h3>
          <p>
            If no lot closes for <strong>7 days</strong>, the keeper force-closes the nearest open lot,
            swaps leftover NVDA to USDG, and sends it to buyback.
            This is a liquidation — not opening a new range.
          </p>
        </div>
      </Module>

      {/* ── 6. Dividends ── */}
      <Module title="6. Dividends">
        <div id="dividends" className="docs-anchor" />
        <div className="docs-prose">
          <p>
            Dividends are paid in <strong>NVDA</strong>, not USDG.
            They come from the 20% of NVDA bought on each lot.
          </p>

          <h3>Epochs</h3>
          <p>
            Dividends run in periods (epochs), usually about <strong>7 days</strong>.
            When an epoch ends and is finalized, eligible {S} holders can claim their share of NVDA.
            Only the previous finalized epoch is claimable at a time.
            Unclaimed NVDA rolls into the next epoch.
          </p>

          <h3>How to claim</h3>
          <ol className="rules-list">
            <li>Connect your wallet and open <Link to="/claim">CLAIM</Link></li>
            <li>If a claimable epoch is live, your amounts and proof load automatically (or fill them in by hand)</li>
            <li>Press <strong>CLAIM NVDA DIVIDENDS</strong> and confirm in your wallet</li>
          </ol>
        </div>
      </Module>

      {/* ── 7. Buyback ── */}
      <Module title="7. Buyback &amp; burn">
        <div id="buyback" className="docs-anchor" />
        <div className="docs-prose">
          <p>
            When lots close, their USDG piles up for buyback.
            Once enough USDG has accumulated, the keeper buys {S} on the market and <strong>burns</strong> it.
          </p>
          <p>
            Live stats — pending USDG, total burned, whether buyback is ready — are in the sidebar on Home.
          </p>
        </div>
      </Module>

      {/* ── 8. Automation ── */}
      <Module title="8. Automation">
        <div id="automation" className="docs-anchor" />
        <div className="docs-prose">
          <p>
            A keeper bot runs in the background and keeps the loop moving:
          </p>
          <ol className="rules-list">
            <li>Buys NVDA when a lot is Ready</li>
            <li>Closes LP when a lot has fully converted to USDG</li>
            <li>Triggers buyback &amp; burn when enough USDG is waiting</li>
            <li>Force-closes a stale lot if nothing closed for 7 days</li>
          </ol>
          <p>
            You do not need to do any of this yourself — just swap, watch lots, and claim dividends.
          </p>
        </div>
      </Module>

      {/* ── 9. Contracts ── */}
      <Module title="9. Contract map">
        <div id="contracts" className="docs-anchor" />
        <div className="docs-prose">
          <table className="lots-table docs-table">
            <thead>
              <tr><th>Contract</th><th>Address</th></tr>
            </thead>
            <tbody>
              <tr><td>{S} token</td><td><ExplorerAddr address={env.stratToken} /></td></tr>
              <tr><td>Strategy hook</td><td><ExplorerAddr address={env.strategyHook} /></td></tr>
              <tr><td>Fee collector</td><td><ExplorerAddr address={env.feeCollector} /></td></tr>
              <tr><td>Lot manager</td><td><ExplorerAddr address={env.lotManager} /></td></tr>
              <tr><td>Asset executor</td><td><ExplorerAddr address={env.assetExecutor} /></td></tr>
              <tr><td>LP position manager</td><td><ExplorerAddr address={env.lpPositionManager} /></td></tr>
              <tr><td>Buyback manager</td><td><ExplorerAddr address={env.buybackManager} /></td></tr>
              <tr><td>Treasury</td><td><ExplorerAddr address={env.treasury} /></td></tr>
              <tr><td>Swap executor</td><td><ExplorerAddr address={env.v4SwapExecutor} /></td></tr>
              <tr><td>Lot reader</td><td><ExplorerAddr address={env.lotReader} /></td></tr>
              <tr><td>Launch manager</td><td><ExplorerAddr address={env.launchManager} /></td></tr>
            </tbody>
          </table>
        </div>
      </Module>

      {/* ── 10. Network ── */}
      <Module title="10. Network &amp; tokens">
        <div id="network" className="docs-anchor" />
        <div className="docs-prose">
          <StatRow
            label="Chain"
            value={
              <a href={EXPLORER} target="_blank" rel="noopener noreferrer">
                Robinhood Chain ({env.chainId})
              </a>
            }
          />
          <hr className="dotted-rule" />
          <StatRow label={`${S}`} value={<ExplorerAddr address={env.stratToken} />} />
          <StatRow label="USDG" value={<ExplorerAddr address={env.usdg} />} />
          <StatRow label="NVDA" value={<ExplorerAddr address={env.nvda} />} />
        </div>
      </Module>

      {/* ── 11. App map ── */}
      <Module title="11. App map">
        <div id="app" className="docs-anchor" />
        <div className="docs-prose">
          <table className="lots-table docs-table">
            <thead>
              <tr><th>Page</th><th>What it is</th></tr>
            </thead>
            <tbody>
              <tr><td><Link to="/">Home</Link></td><td>Landing + the loop</td></tr>
              <tr><td><Link to="/swap">Swap</Link></td><td>Trade USDG ↔ {S}</td></tr>
              <tr><td><Link to="/lots">Lots</Link></td><td>Protocol NVDA positions</td></tr>
              <tr><td><Link to="/claim">Claim</Link></td><td>Claim NVDA dividends</td></tr>
              <tr><td><Link to="/docs">Docs</Link></td><td>This documentation</td></tr>
            </tbody>
          </table>
          <p style={{ marginTop: 10, fontSize: 'var(--fs-small)', color: 'var(--muted)' }}>
            Not financial advice. Fees and other parameters can change.
          </p>
        </div>
      </Module>
    </ForumLayout>
  );
}
