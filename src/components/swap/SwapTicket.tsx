import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { env } from '../../config/env';
import { erc20Abi, stratTokenAbi, v4SwapExecutorAbi } from '../../lib/contracts';
import { formatBps, formatTokenAmount, parseDecimalInput } from '../../lib/format';
import {
  buildStratPoolKey,
  payDecimals,
  paySymbol,
  receiveDecimals,
  receiveSymbol,
  sideToZeroForOne,
  type SwapSide,
} from '../../lib/pool';
import {
  computeMinAmountOut,
  computePriceImpactBps,
  computeRecommendedSlippageBps,
  estimateOutputFromSpot,
  getBuyFeeCountdownLabel,
  getFeeWarningLevel,
  SLIPPAGE_PRESETS,
} from '../../lib/swap';
import { useProtocolStats } from '../../hooks/useProtocolStats';

type FillRecord = {
  time: string;
  side: string;
  amountIn: string;
  amountOut: string;
  tx?: string;
};

const HIST_KEY = 'dump-money-swap-hist';

function loadHist(): FillRecord[] {
  try {
    const raw = localStorage.getItem(HIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHist(records: FillRecord[]) {
  localStorage.setItem(HIST_KEY, JSON.stringify(records.slice(0, 20)));
}

type SwapTicketProps = {
  compact?: boolean;
  defaultSide?: SwapSide;
  showHistory?: boolean;
};

export function SwapTicket({ compact, defaultSide = 'buy', showHistory = !compact }: SwapTicketProps) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const stats = useProtocolStats();

  const [side, setSide] = useState<SwapSide>(defaultSide);
  const [amount, setAmount] = useState('');
  const [slippageMode, setSlippageMode] = useState<string>('auto');
  const [customSlippage, setCustomSlippage] = useState('1');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [hist, setHist] = useState<FillRecord[]>(loadHist);
  const pendingSwap = useRef(false);
  const savedAmount = useRef<{ raw: bigint; out: bigint; min: bigint } | null>(null);

  const payTokenAddr = side === 'buy' ? env.usdg : env.stratToken;
  const hookFeeBps = side === 'buy'
    ? (stats.data?.buyFeeBps ?? 1000)
    : (stats.data?.sellFeeBps ?? 1000);

  const amountRaw = useMemo(
    () => parseDecimalInput(amount, payDecimals(side)),
    [amount, side],
  );

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: payTokenAddr,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: payTokenAddr,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, env.v4SwapExecutor] : undefined,
    query: { enabled: !!address },
  });

  const { data: tradingEnabled } = useReadContract({
    address: env.stratToken,
    abi: stratTokenAbi,
    functionName: 'tradingEnabled',
  });

  const spotPrice = stats.data?.stratPriceUsdg ?? 0;

  const quotedOut = useMemo(() => {
    if (!amountRaw || amountRaw <= 0n) return null;
    return estimateOutputFromSpot(amountRaw, side, spotPrice, hookFeeBps);
  }, [amountRaw, side, spotPrice, hookFeeBps]);

  const priceImpactBps = useMemo(() => {
    if (!quotedOut || !amountRaw || amountRaw <= 0n) return 0;
    const ideal = estimateOutputFromSpot(amountRaw, side, spotPrice, 0);
    return computePriceImpactBps(amountRaw, quotedOut, ideal);
  }, [quotedOut, amountRaw, side, spotPrice]);

  const recommendedBps = computeRecommendedSlippageBps(hookFeeBps, priceImpactBps);

  const slippageBps = useMemo(() => {
    if (slippageMode === 'auto') return recommendedBps;
    if (slippageMode === 'custom') {
      const v = parseFloat(customSlippage);
      return Number.isFinite(v) ? Math.round(v * 100) : recommendedBps;
    }
    return parseInt(slippageMode, 10);
  }, [slippageMode, customSlippage, recommendedBps]);

  const minOut = quotedOut ? computeMinAmountOut(quotedOut, slippageBps) : 0n;

  const feeWarning = side === 'buy' ? getFeeWarningLevel(hookFeeBps) : 'none';
  const countdown = side === 'buy' && stats.data
    ? getBuyFeeCountdownLabel(stats.data.launchTimestamp, hookFeeBps)
    : null;

  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const doSwap = useCallback(() => {
    if (!address || !savedAmount.current) return;
    const poolKey = buildStratPoolKey();
    writeContract({
      address: env.v4SwapExecutor,
      abi: v4SwapExecutorAbi,
      functionName: 'swapExactIn',
      args: [
        poolKey,
        sideToZeroForOne(side),
        savedAmount.current.raw,
        savedAmount.current.min,
        address,
      ],
    });
  }, [address, side, writeContract]);

  useEffect(() => {
    if (!isSuccess || !txHash) return;

    if (pendingSwap.current) {
      pendingSwap.current = false;
      refetchAllowance().then(() => doSwap());
      reset();
      return;
    }

    if (savedAmount.current) {
      const record: FillRecord = {
        time: new Date().toTimeString().slice(0, 8),
        side: side.toUpperCase(),
        amountIn: `${formatTokenAmount(savedAmount.current.raw, payDecimals(side))} ${paySymbol(side)}`,
        amountOut: `${formatTokenAmount(savedAmount.current.out, receiveDecimals(side))} ${receiveSymbol(side)}`,
        tx: txHash,
      };
      const next = [record, ...hist];
      setHist(next);
      saveHist(next);
      setOk(`FILLED · ${side.toUpperCase()} · tx ${txHash.slice(0, 10)}…`);
      setAmount('');
      savedAmount.current = null;
      refetchBalance();
      reset();
    }
  }, [isSuccess, txHash]);

  const executeSwap = () => {
    setErr('');
    setOk('');
    if (!isConnected || !address) {
      setErr('Connect wallet first, ape.');
      return;
    }
    if (chainId !== env.chainId) {
      switchChain({ chainId: env.chainId });
      return;
    }
    if (tradingEnabled === false) {
      setErr('Trading not enabled yet.');
      return;
    }
    if (!amountRaw || amountRaw <= 0n) {
      setErr('Enter an amount greater than zero.');
      return;
    }
    if (balance !== undefined && amountRaw > balance) {
      setErr(`Insufficient balance. MAX is ${formatTokenAmount(balance, payDecimals(side))} ${paySymbol(side)}.`);
      return;
    }
    if (!quotedOut || quotedOut <= 0n) {
      setErr('Could not quote swap. Try again.');
      return;
    }

    savedAmount.current = { raw: amountRaw, out: quotedOut, min: minOut };
    const needsApprove = allowance === undefined || allowance < amountRaw;

    if (needsApprove) {
      pendingSwap.current = true;
      writeContract({
        address: payTokenAddr,
        abi: erc20Abi,
        functionName: 'approve',
        args: [env.v4SwapExecutor, amountRaw],
      });
      return;
    }

    doSwap();
  };

  const onMax = () => {
    if (balance !== undefined) {
      setAmount(formatTokenAmount(balance, payDecimals(side), payDecimals(side)));
    }
  };

  const rateLabel = quotedOut && amountRaw && amountRaw > 0n
    ? `1 ${paySymbol(side)} ≈ ${(Number(quotedOut) / Number(amountRaw) * Math.pow(10, payDecimals(side) - receiveDecimals(side))).toPrecision(4)} ${receiveSymbol(side)}`
    : '—';

  const needsApprove = allowance !== undefined && amountRaw && amountRaw > 0n && allowance < amountRaw;

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); executeSwap(); }} noValidate>
        <div className="side-tabs" role="group" aria-label="Buy or sell">
          <button type="button" className={side === 'buy' ? 'active-buy' : ''} onClick={() => setSide('buy')}>BUY</button>
          <button type="button" className={side === 'sell' ? 'active-sell' : ''} onClick={() => setSide('sell')}>SELL</button>
        </div>

        <div className="field">
          <label htmlFor="from-amt">You pay</label>
          <div className="field-row">
            <input type="text" id="from-amt" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <span className="unit">{paySymbol(side)}</span>
          </div>
          {isConnected && (
            <div className="max-row">
              Balance: <span className="num">{balance !== undefined ? formatTokenAmount(balance, payDecimals(side)) : '—'}</span>
              {' · '}<button type="button" onClick={onMax}>MAX</button>
            </div>
          )}
        </div>

        <button type="button" className="flip-btn" onClick={() => setSide(side === 'buy' ? 'sell' : 'buy')}>↕ flip</button>

        <div className="field">
          <label>You receive (est.)</label>
          <div className="field-row">
            <input type="text" readOnly value={quotedOut ? formatTokenAmount(quotedOut, receiveDecimals(side)) : '0.00'} />
            <span className="unit">{receiveSymbol(side)}</span>
          </div>
        </div>

        <div className="field">
          <label>Slippage tolerance</label>
          <div className="slippage-row">
            {SLIPPAGE_PRESETS.map((p) => (
              <button key={p.id} type="button" className={slippageMode === p.id ? 'active' : ''} onClick={() => setSlippageMode(p.id)}>{p.label}</button>
            ))}
          </div>
          {slippageMode === 'custom' && (
            <div className="field-row" style={{ marginTop: 4 }}>
              <input type="number" min="0.1" max="50" step="0.1" value={customSlippage} onChange={(e) => setCustomSlippage(e.target.value)} />
              <span className="unit">%</span>
            </div>
          )}
          {slippageMode === 'auto' && (
            <div className="max-row">
              Recommended: <span className="num">{formatBps(recommendedBps)}</span>
              {' '}(pool 0.3% + hook {formatBps(hookFeeBps)} + impact ~{formatBps(priceImpactBps)} + 0.5% buffer)
            </div>
          )}
        </div>

        <div className="preview-box">
          <div className="row"><span className="muted">Rate</span><span>{rateLabel}</span></div>
          <div className="row"><span className="muted">Hook fee</span><span className="num">{formatBps(hookFeeBps)}</span></div>
          <div className="row"><span className="muted">Pool fee</span><span>0.3%</span></div>
          <div className="row"><span className="muted">Price impact</span><span>~{formatBps(priceImpactBps)}</span></div>
          <div className="row"><span className="muted">Slippage</span><span>{formatBps(slippageBps)}</span></div>
          <div className="row"><span className="muted">Min received</span><span>{quotedOut ? `${formatTokenAmount(minOut, receiveDecimals(side))} ${receiveSymbol(side)}` : '0.00'}</span></div>
          {countdown && <div className="row"><span className="muted">Fee decay</span><span style={{ fontSize: 10 }}>{countdown}</span></div>}
        </div>

        {feeWarning === 'warn' && <div className="warn-box">High buy fee ({formatBps(hookFeeBps)}). Consider waiting for decay.</div>}
        {feeWarning === 'danger' && <div className="warn-box danger">Anti-snipe zone: buy fee {formatBps(hookFeeBps)}. Wait for fee decay before aping.</div>}

        <button type="submit" className={`btn-swap ${side === 'buy' ? 'buy-mode' : 'sell-mode'}`} disabled={isPending || confirming}>
          {!isConnected ? 'CONNECT WALLET' : isPending || confirming ? 'CONFIRMING…' : needsApprove ? `APPROVE ${paySymbol(side)}` : `SWAP · ${side.toUpperCase()}`}
        </button>

        <div className={`err${err ? ' show' : ''}`} role="alert">{err}</div>
        <div className={`ok${ok ? ' show' : ''}`} role="status">{ok}</div>
      </form>

      {compact && <p className="compact-swap-cta"><Link to="/swap">→ Full swap desk</Link></p>}

      {showHistory && (
        <section className="module" style={{ marginTop: 10 }}>
          <div className="module-head">Recent fills (session)</div>
          <div className="module-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="hist-table">
              <thead><tr><th>Time</th><th>Side</th><th>In</th><th>Out</th></tr></thead>
              <tbody>
                {hist.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>No fills yet this session</td></tr>
                ) : hist.slice(0, 8).map((h, i) => (
                  <tr key={i}>
                    <td>{h.time}</td>
                    <td className={`num ${h.side === 'BUY' ? 'up' : 'down'}`}>{h.side}</td>
                    <td>{h.amountIn}</td>
                    <td>{h.amountOut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
