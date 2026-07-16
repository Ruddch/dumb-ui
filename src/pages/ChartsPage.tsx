import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ForumLayout } from '../components/layout/ForumLayout';
import { Module } from '../components/layout/Module';
import { usePoolPrice } from '../hooks/useProtocolStats';
import { env } from '../config/env';
import { fmtNum } from '../lib/format';

type Ticker = 'NVDASTR' | 'NVDA';
const RANGES = ['1D', '1W', '1M', '3M', 'YTD'] as const;

function generateSeries(basePrice: number, points: number): number[] {
  const out: number[] = [];
  let p = basePrice * 0.92;
  for (let i = 0; i < points; i++) {
    p += (Math.random() - 0.48) * basePrice * 0.02;
    p = Math.max(basePrice * 0.7, Math.min(basePrice * 1.15, p));
    out.push(p);
  }
  out[out.length - 1] = basePrice;
  return out;
}

function SvgLineChart({ prices, width = 600, height = 160 }: { prices: number[]; width?: number; height?: number }) {
  const { path, min, max } = useMemo(() => {
    const mn = Math.min(...prices);
    const mx = Math.max(...prices);
    const pad = (mx - mn) * 0.05 || 1;
    const lo = mn - pad;
    const hi = mx + pad;
    const pts = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - lo) / (hi - lo)) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return { path: pts.join(' '), min: lo, max: hi };
  }, [prices, width, height]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Price chart">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={0} y1={height * f} x2={width} y2={height * f} stroke="#ccc" strokeDasharray="4 3" />
      ))}
      <path d={path} fill="none" stroke="#336699" strokeWidth={1.5} />
      <text x={4} y={12} fontSize={10} fill="#888" fontFamily="Courier New">{max.toFixed(2)}</text>
      <text x={4} y={height - 4} fontSize={10} fill="#888" fontFamily="Courier New">{min.toFixed(2)}</text>
    </svg>
  );
}

function CandleStrip({ prices }: { prices: number[] }) {
  const candles = prices.slice(-24);
  const mx = Math.max(...candles);
  const mn = Math.min(...candles);
  return (
    <div style={{ display: 'flex', gap: 1, height: 40, alignItems: 'flex-end', marginTop: 8 }}>
      {candles.map((c, i) => {
        const h = ((c - mn) / (mx - mn || 1)) * 36 + 4;
        const up = i === 0 || c >= candles[i - 1];
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: h,
              background: up ? 'transparent' : '#CC0000',
              border: `1px solid ${up ? '#00A000' : '#CC0000'}`,
            }}
          />
        );
      })}
    </div>
  );
}

export function ChartsPage() {
  const [ticker, setTicker] = useState<Ticker>('NVDASTR');
  const [range, setRange] = useState<(typeof RANGES)[number]>('1W');

  const stratPrice = usePoolPrice(env.stratUsdgPoolId, env.usdgDecimals, env.stratDecimals, true);
  const nvdaPrice = usePoolPrice(env.nvdaUsdgPoolId, env.usdgDecimals, 18, false);

  const active = ticker === 'NVDASTR' ? stratPrice : nvdaPrice;
  const price = active.data?.price ?? 0;
  const series = useMemo(() => generateSeries(price || 1, range === '1D' ? 24 : 48), [price, range]);
  const open = series[0];
  const close = series[series.length - 1];
  const high = Math.max(...series);
  const low = Math.min(...series);
  const chg = close - open;
  const chgPct = open ? (chg / open) * 100 : 0;

  return (
    <ForumLayout
      breadcrumb={<>You are here: <Link to="/">Home</Link> &gt; <strong>Charts</strong></>}
      sidebar={(
        <Module title="About chart">
          <p style={{ fontSize: 'var(--fs-small)' }}>Live spot from StateView. History is illustrative (no indexer yet).</p>
          <p style={{ fontSize: 'var(--fs-small)', marginTop: 6 }}>
            <a href="https://dexscreener.com/robinhood/0x3bb34a44f1b2b5f32c034c38a53065a521a47b199700fa9bd19d60985ff24bf1" target="_blank" rel="noreferrer">DexScreener NVDA/USDG →</a>
          </p>
        </Module>
      )}
    >
      <Module title="Price Charts — terminal view">
        <div className="ticker-tabs" role="tablist">
          <button type="button" className={ticker === 'NVDASTR' ? 'active' : ''} onClick={() => setTicker('NVDASTR')}>{env.tokenSymbol}/USDG</button>
          <button type="button" className={ticker === 'NVDA' ? 'active' : ''} onClick={() => setTicker('NVDA')}>NVDA/USDG</button>
        </div>

        <div className="quote-strip">
          <span className={`last num ${chg >= 0 ? 'up' : 'down'}`}>
            ${price ? fmtNum(price, 4) : '—'}
          </span>
          <span className={`num ${chg >= 0 ? 'up' : 'down'}`}>
            {chg >= 0 ? '+' : ''}{fmtNum(chg, 4)} ({chgPct >= 0 ? '+' : ''}{fmtNum(chgPct, 2)}%)
          </span>
          <span>Tick <span className="num">{active.data?.tick ?? '—'}</span></span>
          <span>Pair: <strong>{ticker === 'NVDASTR' ? `${env.tokenSymbol}/USDG` : 'NVDA/USDG'}</strong></span>
        </div>

        <div className="range-row">
          {RANGES.map((r) => (
            <button key={r} type="button" className={range === r ? 'active' : ''} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>

        <p className="ascii-label">[ ascii / early-finance chart — illustrative history ]</p>
        <div className="chart-frame">
          {price > 0 ? <SvgLineChart prices={series} /> : <p style={{ padding: 20, textAlign: 'center' }}>Loading price…</p>}
        </div>

        <table className="ohlc-table">
          <thead>
            <tr><th>Period</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Chg %</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>{range}</td>
              <td className="num">{fmtNum(open, 4)}</td>
              <td className="num up">{fmtNum(high, 4)}</td>
              <td className="num down">{fmtNum(low, 4)}</td>
              <td className={`num ${chg >= 0 ? 'up' : 'down'}`}>{fmtNum(close, 4)}</td>
              <td className={`num ${chg >= 0 ? 'up' : 'down'}`}>{fmtNum(chgPct, 2)}</td>
            </tr>
          </tbody>
        </table>

        {price > 0 && <CandleStrip prices={series} />}
        <p className="legend-note">Illustrative OHLC from synthetic walk anchored to live pool spot. Not financial advice.</p>
      </Module>
    </ForumLayout>
  );
}
