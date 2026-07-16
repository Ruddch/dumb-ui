import {
  FEE_DECAY_BPS_PER_MIN,
  POOL_FEE_BPS,
  RESTING_BUY_FEE_BPS,
  SLIPPAGE_BUFFER_BPS,
} from './contracts';

export function computeRecommendedSlippageBps(
  hookFeeBps: number,
  priceImpactBps: number,
): number {
  return POOL_FEE_BPS + hookFeeBps + priceImpactBps + SLIPPAGE_BUFFER_BPS;
}

export function computeMinAmountOut(quotedOut: bigint, slippageBps: number): bigint {
  return (quotedOut * BigInt(10000 - slippageBps)) / 10000n;
}

export function estimateOutputFromSpot(
  amountIn: bigint,
  side: 'buy' | 'sell',
  spotPriceUsdgPerStrat: number,
  hookFeeBps: number,
): bigint {
  if (amountIn <= 0n || spotPriceUsdgPerStrat <= 0) return 0n;

  const feeFactor = BigInt(10000 - hookFeeBps);
  const poolFactor = BigInt(10000 - POOL_FEE_BPS);
  const combined = (feeFactor * poolFactor) / 10000n;

  if (side === 'buy') {
    const usdg = Number(amountIn) / 1e6;
    const strat = (usdg / spotPriceUsdgPerStrat) * Number(combined) / 10000;
    return BigInt(Math.floor(strat * 1e18));
  }
  const strat = Number(amountIn) / 1e18;
  const usdg = strat * spotPriceUsdgPerStrat * Number(combined) / 10000;
  return BigInt(Math.floor(usdg * 1e6));
}

export function computePriceImpactBps(
  _amountIn: bigint,
  estimatedOut: bigint,
  spotOut: bigint,
): number {
  if (spotOut <= 0n || estimatedOut <= 0n) return 0;
  const diff = spotOut > estimatedOut ? spotOut - estimatedOut : estimatedOut - spotOut;
  return Number((diff * 10000n) / spotOut);
}

export function getNextFeeDecaySeconds(launchTimestamp: bigint, nowSec: number): number {
  if (launchTimestamp === 0n) return 0;
  const elapsed = nowSec - Number(launchTimestamp);
  const secIntoMinute = elapsed % 60;
  return secIntoMinute === 0 ? 60 : 60 - secIntoMinute;
}

export function getBuyFeeCountdownLabel(launchTimestamp: bigint, buyFeeBps: number): string | null {
  if (launchTimestamp === 0n || buyFeeBps <= RESTING_BUY_FEE_BPS) return null;
  const reductionsLeft = Math.ceil((buyFeeBps - RESTING_BUY_FEE_BPS) / FEE_DECAY_BPS_PER_MIN);
  return `−${FEE_DECAY_BPS_PER_MIN / 100}% in ~${getNextFeeDecaySeconds(launchTimestamp, Math.floor(Date.now() / 1000))}s (${reductionsLeft} steps to ${RESTING_BUY_FEE_BPS / 100}%)`;
}

export function getFeeWarningLevel(buyFeeBps: number): 'none' | 'warn' | 'danger' {
  if (buyFeeBps > 5000) return 'danger';
  if (buyFeeBps > 2000) return 'warn';
  return 'none';
}

export const SLIPPAGE_PRESETS = [
  { id: 'auto', label: 'Auto' },
  { id: '50', label: '0.5%' },
  { id: '100', label: '1%' },
  { id: '300', label: '3%' },
  { id: 'custom', label: 'Custom' },
] as const;
