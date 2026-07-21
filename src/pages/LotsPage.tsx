import { Link } from 'react-router-dom';
import { ForumLayout } from '../components/layout/ForumLayout';
import { Module, StatRow } from '../components/layout/Module';
import { useLots } from '../hooks/useLots';
import { LOT_STATUS_LABELS } from '../lib/contracts';
import { formatTokenAmount, formatUsdAmount, sqrtPriceX96ToPrice, tickToHumanPrice } from '../lib/format';
import { positionNftExplorerUrl, uniswapV4PositionUrl } from '../lib/links';
import { expectedUsdgFromNvdaLp } from '../lib/tickMath';
import { env } from '../config/env';

const LOT_SHARE_BPS = 8000n;
const BPS = 10000n;

function usdgIntoLp(usdgSpent: bigint): bigint {
  return (usdgSpent * LOT_SHARE_BPS) / BPS;
}

/** Progress % from LotReader.conversionProgressBps (0–10000). */
function progressPct(conversionProgressBps: bigint): number {
  return Number(conversionProgressBps) / 100;
}

function buyPriceUsdgPerNvda(usdgSpent: bigint, nvdaBought: bigint): number {
  if (nvdaBought === 0n) return NaN;
  const usdg = Number(usdgSpent) / 10 ** env.usdgDecimals;
  const nvda = Number(nvdaBought) / 10 ** env.nvdaDecimals;
  return usdg / nvda;
}

function fmtPrice(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n >= 1 ? `$${n.toFixed(4)}` : `$${n.toPrecision(4)}`;
}

export function LotsPage() {
  const { data, isLoading, isError } = useLots();

  const sidebar = (
    <>
      <Module title="Legend">
        <p style={{ fontSize: 'var(--fs-small)' }}>
          Fees buy NVDA → 80% into sell-band LP, 20% dividends (ignored here).
          Card shows: USDG into LP (spent × 0.8), NVDA in LP, buy price, expected USDG after full conversion, exit NVDA price, stage.
        </p>
        <hr className="dotted-rule" />
        <StatRow label="Statuses" value="5 states" />
        <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
          {Object.entries(LOT_STATUS_LABELS).map(([k, v]) => `${k}=${v}`).join(' · ')}
        </p>
      </Module>
      <Module title="Stale liquidation">
        <p style={{ fontSize: 'var(--fs-small)' }}>
          If no lot closes for 7 days, keeper force-closes nearest active lot → buyback.
        </p>
      </Module>
    </>
  );

  if (!env.lotReader) {
    return (
      <ForumLayout breadcrumb={<>You are here: <Link to="/">Home</Link> &gt; <strong>Lots</strong></>} sidebar={sidebar}>
        <Module title="LotReader not configured" announce>
          <p style={{ fontSize: 'var(--fs-small)' }}>
            Set <code>VITE_LOT_READER</code> in <code>.env</code>.
          </p>
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
              <div className="lbl">Into pool (closed)</div>
              <div className="val num">{formatUsdAmount(usdgIntoLp(data.totals.totalUsdgInvested))}</div>
            </div>
            <div className="sum-box">
              <div className="lbl">Out of pool</div>
              <div className="val num">{formatUsdAmount(data.totals.totalUsdgReceived)}</div>
            </div>
          </div>

          {data.active.length === 0 ? (
            <Module title="No active lots"><p style={{ fontSize: 'var(--fs-small)' }}>No Ready or LPActive lots right now.</p></Module>
          ) : (
            data.active.map((lot) => {
              const intoLp = usdgIntoLp(lot.usdgAmount);
              const nvdaBought = lot.nvdaAmount + lot.nvdaToDividends;
              const price = buyPriceUsdgPerNvda(lot.usdgAmount, nvdaBought);
              const expectedOut =
                lot.status === 3 && lot.tickLower !== 0
                  ? expectedUsdgFromNvdaLp(lot.nvdaAmount, lot.tickLower, lot.tickUpper)
                  : intoLp;
              // Full-convert NVDA price: sellAtSqrtPriceX96 from reader, else exit tick by token side.
              const exitNvdaPrice =
                lot.sellAtSqrtPriceX96 > 0n
                  ? sqrtPriceX96ToPrice(
                      lot.sellAtSqrtPriceX96,
                      env.usdgDecimals,
                      env.nvdaDecimals,
                      true,
                    )
                  : tickToHumanPrice(
                      lot.nvdaIsToken0 ? lot.tickUpper : lot.tickLower || lot.tickUpper,
                      env.usdgDecimals,
                      env.nvdaDecimals,
                      false,
                    );
              const progress = progressPct(lot.conversionProgressBps);
              const hasPos = lot.lpTokenId > 0n;

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
                    <div className="lot-cell">
                      <span className="k">USDG Invested</span>
                      <span className="v num">{formatUsdAmount(intoLp)}</span>
                    </div>
                    <div className="lot-cell">
                      <span className="k">NVDA Purchased</span>
                      <span className="v num">{formatTokenAmount(lot.nvdaAmount, env.nvdaDecimals, 6)}</span>
                    </div>
                    <div className="lot-cell">
                      <span className="k">NVDA Buy price</span>
                      <span className="v num">{fmtPrice(price)}</span>
                    </div>
                    <div className="lot-cell">
                      <span className="k">Expected USDG after Conversion</span>
                      <span className="v num">{formatUsdAmount(expectedOut)}</span>
                    </div>
                    <div className="lot-cell">
                      <span className="k">NVDA Exit price</span>
                      <span className="v num">{lot.status === 3 ? fmtPrice(exitNvdaPrice) : '—'}</span>
                    </div>
                    <div className="lot-cell">
                      <span className="k">Status</span>
                      <span className="v">
                        {lot.status === 1
                          ? 'Waiting execute'
                          : lot.fullyConverted || progress >= 100
                            ? 'Fully converted'
                            : progress <= 0
                              ? 'Not converting yet'
                              : `Converting ${progress.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                  {lot.status === 3 && (
                    <div className="sold-bar-wrap">
                      <div className="sold-bar-meta">
                        <span>Conversion through sell-band</span>
                        <span className="num">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="sold-bar">
                        <div className="fill-progress" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="lot-actions">
                    {hasPos ? (
                      <>
                        <a className="btn btn-ok" href={uniswapV4PositionUrl(lot.lpTokenId)} target="_blank" rel="noreferrer">
                          Uniswap position
                        </a>
                        <a className="btn" href={positionNftExplorerUrl(lot.lpTokenId)} target="_blank" rel="noreferrer">
                          NFT #{lot.lpTokenId.toString()}
                        </a>
                      </>
                    ) : (
                      <span style={{ fontSize: 'var(--fs-small)', color: 'var(--muted)' }}>No LP NFT yet</span>
                    )}
                  </div>
                </article>
              );
            })
          )}

          <Module title="Closed lots">
            <div style={{ overflowX: 'auto' }}>
              <table className="lots-table">
                <thead>
                  <tr>
                    <th>Lot</th>
                    <th>Into pool</th>
                    <th>Out of pool</th>
                    <th>Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.closed.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center' }}>No closed lots yet</td></tr>
                  ) : (
                    data.closed.map((lot) => (
                      <tr key={lot.lotId.toString()}>
                        <td>#{lot.lotId.toString()}</td>
                        <td>{formatUsdAmount(usdgIntoLp(lot.usdgInvested))}</td>
                        <td className="num up">{formatUsdAmount(lot.usdgReceived)}</td>
                        <td>{new Date(Number(lot.closedAt) * 1000).toLocaleString()}</td>
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
