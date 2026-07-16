import { env } from '../config/env';

export function buildStratPoolKey() {
  return {
    currency0: env.usdg,
    currency1: env.stratToken,
    fee: env.poolFee,
    tickSpacing: env.tickSpacing,
    hooks: env.strategyHook,
  } as const;
}

export type SwapSide = 'buy' | 'sell';

export function sideToZeroForOne(side: SwapSide): boolean {
  return side === 'buy';
}

export function payToken(side: SwapSide): `0x${string}` {
  return side === 'buy' ? env.usdg : env.stratToken;
}

export function receiveToken(side: SwapSide): `0x${string}` {
  return side === 'buy' ? env.stratToken : env.usdg;
}

export function payDecimals(side: SwapSide): number {
  return side === 'buy' ? env.usdgDecimals : env.stratDecimals;
}

export function receiveDecimals(side: SwapSide): number {
  return side === 'buy' ? env.stratDecimals : env.usdgDecimals;
}

export function paySymbol(side: SwapSide): string {
  return side === 'buy' ? 'USDG' : env.tokenSymbol;
}

export function receiveSymbol(side: SwapSide): string {
  return side === 'buy' ? env.tokenSymbol : 'USDG';
}
