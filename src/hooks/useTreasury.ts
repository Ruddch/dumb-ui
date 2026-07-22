import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { env } from '../config/env';
import { erc20Abi, treasuryAbi } from '../lib/contracts';

export type EpochInfo = {
  epochId: bigint;
  startTime: bigint;
  endTime: bigint;
  totalDividends: bigint;
  claimedAmount: bigint;
  merkleRoot: `0x${string}`;
  isFinalized: boolean;
  isClaimable: boolean;
  rolloverProcessed: boolean;
};

function mapEpoch(raw: readonly [
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  `0x${string}`,
  boolean,
  boolean,
  boolean,
]): EpochInfo {
  return {
    epochId: raw[0],
    startTime: raw[1],
    endTime: raw[2],
    totalDividends: raw[3],
    claimedAmount: raw[4],
    merkleRoot: raw[5],
    isFinalized: raw[6],
    isClaimable: raw[7],
    rolloverProcessed: raw[8],
  };
}

export function useTreasury(claimableEpochId: bigint | undefined, userAddress?: `0x${string}`) {
  const client = usePublicClient();

  return useQuery({
    queryKey: ['treasury', claimableEpochId?.toString(), userAddress],
    queryFn: async () => {
      if (!client) throw new Error('No client');

      const [currentEpoch, claimableEpoch, epochDuration, nvdaBalance] = await Promise.all([
        client.readContract({
          address: env.treasury,
          abi: treasuryAbi,
          functionName: 'currentEpoch',
        }),
        client.readContract({
          address: env.treasury,
          abi: treasuryAbi,
          functionName: 'getCurrentClaimableEpoch',
        }),
        client.readContract({
          address: env.treasury,
          abi: treasuryAbi,
          functionName: 'epochDuration',
        }),
        client.readContract({
          address: env.nvda,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [env.treasury],
        }),
      ]);

      let epoch: EpochInfo | null = null;
      let currentEpochInfo: EpochInfo | null = null;
      let userClaim: { weightedBalance: bigint; claimAmount: bigint; hasClaimed: boolean } | null = null;

      if (currentEpoch > 0n) {
        const rawCurrent = await client.readContract({
          address: env.treasury,
          abi: treasuryAbi,
          functionName: 'epochs',
          args: [currentEpoch],
        });
        currentEpochInfo = mapEpoch(rawCurrent);
      }

      if (claimableEpoch > 0n) {
        const eid = claimableEpochId ?? claimableEpoch;
        if (currentEpochInfo && eid === currentEpochInfo.epochId) {
          epoch = currentEpochInfo;
        } else {
          const raw = await client.readContract({
            address: env.treasury,
            abi: treasuryAbi,
            functionName: 'epochs',
            args: [eid],
          });
          epoch = mapEpoch(raw);
        }

        if (userAddress) {
          const uc = await client.readContract({
            address: env.treasury,
            abi: treasuryAbi,
            functionName: 'userClaims',
            args: [eid, userAddress],
          });
          userClaim = {
            weightedBalance: uc[0],
            claimAmount: uc[1],
            hasClaimed: uc[2],
          };
        }
      }

      return {
        currentEpoch,
        claimableEpoch,
        epochDuration,
        epoch,
        currentEpochInfo,
        nvdaBalance,
        userClaim,
      };
    },
    refetchInterval: 20_000,
    enabled: !!client,
  });
}
