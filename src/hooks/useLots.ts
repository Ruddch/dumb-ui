import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { env } from '../config/env';
import { lotReaderAbi } from '../lib/contracts';

export type ActiveLot = {
  lotId: bigint;
  status: number;
  usdgAmount: bigint;
  nvdaAmount: bigint;
  nvdaToDividends: bigint;
  lpTokenId: bigint;
  tickLower: number;
  tickUpper: number;
  currentTick: number;
  sellAtSqrtPriceX96: bigint;
  fullyConverted: boolean;
  openedAt: bigint;
};

export type ClosedLot = {
  lotId: bigint;
  usdgInvested: bigint;
  usdgReceived: bigint;
  nvdaPurchased: bigint;
  nvdaToDividends: bigint;
  tickLower: number;
  tickUpper: number;
  openedAt: bigint;
  closedAt: bigint;
};

export function useLots() {
  const client = usePublicClient();
  const hasReader = !!env.lotReader;

  return useQuery({
    queryKey: ['lots', env.lotReader],
    queryFn: async () => {
      if (!client || !env.lotReader) throw new Error('LotReader not configured');

      const [active, closedResult, totals] = await Promise.all([
        client.readContract({
          address: env.lotReader,
          abi: lotReaderAbi,
          functionName: 'getActiveLots',
        }),
        client.readContract({
          address: env.lotReader,
          abi: lotReaderAbi,
          functionName: 'getClosedLots',
          args: [0n, 20n],
        }),
        client.readContract({
          address: env.lotReader,
          abi: lotReaderAbi,
          functionName: 'getClosedLotsTotals',
        }),
      ]);

      return {
        active: active as ActiveLot[],
        closed: closedResult[0] as ClosedLot[],
        closedTotal: closedResult[1],
        totals: {
          closedCount: totals[0],
          totalUsdgInvested: totals[1],
          totalUsdgReceived: totals[2],
        },
      };
    },
    enabled: !!client && hasReader,
    refetchInterval: 30_000,
  });
}
