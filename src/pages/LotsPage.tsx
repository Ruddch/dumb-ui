import { Link } from 'react-router-dom';
import { ForumLayout } from '../components/layout/ForumLayout';
import { Module, StatRow } from '../components/layout/Module';
import { useLots } from '../hooks/useLots';
import { LOT_STATUS_LABELS } from '../lib/contracts';
import { formatTokenAmount, formatUsdAmount, tickToHumanPrice } from '../lib/format';
import { env } from '../config/env';

function exitProgress(currentTick: number, tickLower: number, tickUpper: number): number {
  if (tickUpper <= tickLower) return 0;
  const p = ((currentTick - tickLower) / (tickUpper - tickLower)) * 100;
  return Math.max(0, Math.min(100, p));
}

export function LotsPage() {
  const { data, isLoading, isError } = useLots();

  const sidebar = (
    <>
      <Module title="Legend">
        <p style={{ fontSize: 'var(--fs-small)' }}>
          Lots are protocol NVDA positions funded by trading fees. On execute: 80% NVDA → LP below price, 20% → Treasury dividends.
          Progress bar shows how close current NVDA tick is to exit (tick upper).
        </p>
        <hr className="dotted-rule" />
        <StatRow label="Statuses" value="5 states" />
        <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
          {Object.entries(LOT_STATUS_LABELS).map(([k, v]) => `${k}=${v}`).join(' · ')}
        </p>
      </Module>
      <Module title="Stale liquidation">
        <p style={{ fontSize: 'var(--fs-small)' }}>
          If no lot closes for 7 days, keeper calls <code>repositionStaleLot</code> — force-close nearest active lot, swap remaining NVDA→USDG, send to buyback.
          Permissionless reward: 50 bps.
        </p>
      </Module>
    </>
  );

  if (!env.lotReader) {
    return (
      <ForumLayout breadcrumb={<>You are here: <Link to="/">Home</Link> &gt; <strong>Lots</strong></>} sidebar={sidebar}>
        <Module title="LotReader not configured" announce>
          <p style={{ fontSize: 'var(--fs-small)' }}>
            Deploy LotReader and set <code>VITE_LOT_READER</code> in <code>.env</code>:
          </p>
          <pre style={{ fontSize: 10, marginTop: 8, fontFamily: 'var(--font-mono)' }}>
            {`cd contracts\nsource .env.deploy\nforge script script/DeployLotReader.s.sol --rpc-url $ROBINHOOD_RPC_URL --broadcast`}
          </pre>
        </Module>
      </ForumLayout>
    );
  }

  return (
    <ForumLayout breadcrumb={<>You are here: <Link to="/">Home</Link> &gt; <strong>Lots</strong></>} sidebar={sidebar}>
      <Module title="Protocol lots — NVDA positions" announce>
        <p style={{ fontSize: 'var(--fs-small)' }}>
          Active lots from LotReader on-chain. Ready = USDG accumulated; LPActive = NVDA LP open below price (dashboard shows Ready + LPActive).
        </p>
      </Module>

      {isLoading && <Module title="Loading"><p>Fetching lots…</p></Module>}
      {isError && <Module title="Error"><p style={{ color: 'var(--loss)' }}>Failed to load lots from LotReader.</p></Module>}

      {data && (
        <>
          <div className="lots-summary">
            <div className="sum-box">
              <div className="lbl">Active lots</div>
              <div className="val num">{data.active.length}</div>
            </div>
            <div className="sum-box">
              <div className="lbl">Closed lots</div>
              <div className="val num">{data.totals.closedCount.toString()}</div>
            </div>
            <div className="sum-box">
              <div className="lbl">USDG from closes</div>
              <div className="val num">{formatUsdAmount(data.totals.totalUsdgReceived)}</div>
            </div>
          </div>

          {data.active.length === 0 ? (
            <Module title="No active lots"><p style={{ fontSize: 'var(--fs-small)' }}>No Ready or LPActive lots right now.</p></Module>
          ) : (
            data.active.map((lot) => {
              const progress = lot.status === 3
                ? exitProgress(lot.currentTick, lot.tickLower, lot.tickUpper)
                : 0;
              const exitPrice = tickToHumanPrice(lot.tickUpper, env.usdgDecimals, env.nvdaDecimals, false);
              return (
                <article className="lot-card" key={lot.lotId.toString()}>
                  <div className="lot-card-head">
                    <span><span className="ticker">{env.tokenSymbol}</span> · Lot #{lot.lotId.toString()}</span>
                    <span className={`lot-badge ${lot.status === 3 ? 'open' : 'partial'}`}>
                      {LOT_STATUS_LABELS[lot.status] ?? lot.status}
                      {lot.fullyConverted ? ' · CONVERTED' : ''}
                    </span>
                  </div>
                  <div className="lot-grid">
                    <div className="lot-cell"><span className="k">USDG in lot</span><span className="v num">{formatUsdAmount(lot.usdgAmount)}</span></div>
                    <div className="lot-cell"><span className="k">NVDA in LP</span><span className="v num">{formatTokenAmount(lot.nvdaAmount, env.nvdaDecimals, 4)}</span></div>
                    <div className="lot-cell"><span className="k">NVDA → dividends</span><span className="v num">{formatTokenAmount(lot.nvdaToDividends, env.nvdaDecimals, 4)}</span></div>
                    <div className="lot-cell"><span className="k">Current tick</span><span className="v num">{lot.currentTick}</span></div>
                    <div className="lot-cell"><span className="k">Exit tick (upper)</span><span className="v num">{lot.tickUpper}</span></div>
                    <div className="lot-cell"><span className="k">Exit price (NVDA/USDG)</span><span className="v num">${exitPrice.toFixed(2)}</span></div>
                    <div className="lot-cell"><span className="k">LP token ID</span><span className="v num">{lot.lpTokenId.toString() || '—'}</span></div>
                  </div>
                  {lot.status === 3 && (
                    <div className="sold-bar-wrap">
                      <div className="sold-bar-meta">
                        <span>Progress to exit</span>
                        <span className="num">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="sold-bar">
                        <div className="fill-progress" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="lot-actions">
                    <Link to="/swap" className="btn btn-ok">Buy {env.tokenSymbol}</Link>
                    <Link to="/swap?side=sell" className="btn btn-danger">Sell {env.tokenSymbol}</Link>
                  </div>
                </article>
              );
            })
          )}

          <Module title="Closed lots ledger">
            <div style={{ overflowX: 'auto' }}>
              <table className="lots-table">
                <thead>
                  <tr>
                    <th>Lot</th><th>USDG in</th><th>USDG out</th><th>NVDA bought</th><th>NVDA dividends</th><th>Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.closed.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center' }}>No closed lots yet</td></tr>
                  ) : (
                    data.closed.map((lot) => (
                      <tr key={lot.lotId.toString()}>
                        <td>#{lot.lotId.toString()}</td>
                        <td>{formatUsdAmount(lot.usdgInvested)}</td>
                        <td className="num up">{formatUsdAmount(lot.usdgReceived)}</td>
                        <td>{formatTokenAmount(lot.nvdaPurchased, env.nvdaDecimals, 2)}</td>
                        <td>{formatTokenAmount(lot.nvdaToDividends, env.nvdaDecimals, 2)}</td>
                        <td>{new Date(Number(lot.closedAt) * 1000).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Module>
        </>
      )}
    </ForumLayout>
  );
}
