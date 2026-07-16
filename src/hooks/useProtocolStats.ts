import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { env } from '../config/env';
import {
  buybackManagerAbi,
  feeCollectorAbi,
  lotManagerAbi,
  stateViewAbi,
  strategyHookAbi,
} from '../lib/contracts';
import { sqrtPriceX96ToPrice } from '../lib/format';

export function useProtocolStats() {
  const client = usePublicClient();

  return useQuery({
    queryKey: ['protocolStats'],
    queryFn: async () => {
      if (!client) throw new Error('No client');

      const [
        buyFeeBps,
        sellFeeBps,
        launchTimestamp,
        totalBurned,
        pendingUSDG,
        buybackInfo,
        , // totalFees
        , // lotThreshold
        slot0,
      ] = await Promise.all([
        client.readContract({
          address: env.strategyHook,
          abi: strategyHookAbi,
          functionName: 'calculateBuyFeeBps',
        }),
        client.readContract({
          address: env.strategyHook,
          abi: strategyHookAbi,
          functionName: 'calculateSellFeeBps',
        }),
        client.readContract({
          address: env.strategyHook,
          abi: strategyHookAbi,
          functionName: 'launchTimestamp',
        }),
        client.readContract({
          address: env.buybackManager,
          abi: buybackManagerAbi,
          functionName: 'totalStratBurned',
        }),
        client.readContract({
          address: env.buybackManager,
          abi: buybackManagerAbi,
          functionName: 'pendingUSDG',
        }),
        client.readContract({
          address: env.buybackManager,
          abi: buybackManagerAbi,
          functionName: 'canTriggerBuyback',
        }),
        client.readContract({
          address: env.feeCollector,
          abi: feeCollectorAbi,
          functionName: 'totalFeesReceived',
        }),
        client.readContract({
          address: env.lotManager,
          abi: lotManagerAbi,
          functionName: 'lotThreshold',
        }),
        client.readContract({
          address: env.stateView,
          abi: stateViewAbi,
          functionName: 'getSlot0',
          args: [env.stratUsdgPoolId],
        }),
      ]);

      // const stratPriceUsdg = sqrtPriceX96ToPrice(
      //   slot0[0],
      //   env.usdgDecimals,
      //   env.stratDecimals,
      //   true,
      // );

      return {
        buyFeeBps: Number(buyFeeBps),
        sellFeeBps: Number(sellFeeBps),
        launchTimestamp,
        totalBurned,
        pendingUSDG,
        canBuyback: buybackInfo[0],
        buybackThreshold: 100n, // buybackInfo[2],
        totalFees: 0n, // totalFees,
        lotThreshold: 100000000n,
        stratPriceUsdg: 0,
        sqrtPriceX96: 0n, // slot0[0],
        tick: slot0[1],
      };
    },
    refetchInterval: 15_000,
    enabled: !!client,
  });
}

export function usePoolPrice(poolId: `0x${string}`, token0Decimals: number, token1Decimals: number, wantToken0PerToken1: boolean) {
  const client = usePublicClient();

  return useQuery({
    queryKey: ['poolPrice', poolId, wantToken0PerToken1],
    queryFn: async () => {
      if (!client) throw new Error('No client');
      const slot0 = await client.readContract({
        address: env.stateView,
        abi: stateViewAbi,
        functionName: 'getSlot0',
        args: [poolId],
      });
      return {
        price: sqrtPriceX96ToPrice(slot0[0], token0Decimals, token1Decimals, wantToken0PerToken1),
        tick: slot0[1],
        sqrtPriceX96: slot0[0],
      };
    },
    refetchInterval: 15_000,
    enabled: !!client,
  });
}
