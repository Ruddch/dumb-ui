import { env } from '../config/env';

export function formatUsdAmount(raw: bigint, decimals = env.usdgDecimals): string {
  const s = raw.toString().padStart(decimals + 1, '0');
  const whole = s.slice(0, -decimals) || '0';
  const frac = s.slice(-decimals).replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
}

export function formatTokenAmount(raw: bigint, decimals: number, maxFrac = 4): string {
  const s = raw.toString().padStart(decimals + 1, '0');
  const whole = s.slice(0, -decimals) || '0';
  let frac = s.slice(-decimals);
  if (maxFrac < decimals) frac = frac.slice(0, maxFrac);
  frac = frac.replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}

export function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function parseDecimalInput(value: string, decimals: number): bigint | null {
  const trimmed = value.trim();
  if (!trimmed || !/^\d*\.?\d*$/.test(trimmed)) return null;
  const [whole = '0', frac = ''] = trimmed.split('.');
  if (frac.length > decimals) return null;
  const padded = frac.padEnd(decimals, '0');
  try {
    return BigInt(whole + padded);
  } catch {
    return null;
  }
}

export function fmtNum(n: number, d = 2): string {
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function tickToHumanPrice(
  tick: number,
  token0Decimals: number,
  token1Decimals: number,
  priceToken1PerToken0: boolean,
): number {
  const price = Math.pow(1.0001, tick);
  const decimalAdj = Math.pow(10, token0Decimals - token1Decimals);
  const token1PerToken0 = price * decimalAdj;
  return priceToken1PerToken0 ? token1PerToken0 : 1 / token1PerToken0;
}

export function sqrtPriceX96ToPrice(
  sqrtPriceX96: bigint,
  token0Decimals: number,
  token1Decimals: number,
  wantToken0PerToken1: boolean,
): number {
  const Q96 = 2n ** 96n;
  const ratio = Number(sqrtPriceX96) / Number(Q96);
  const priceRaw = ratio * ratio;
  const decimalAdj = Math.pow(10, token0Decimals - token1Decimals);
  const token1PerToken0 = priceRaw * decimalAdj;
  return wantToken0PerToken1 ? 1 / token1PerToken0 : token1PerToken0;
}
