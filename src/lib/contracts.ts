export const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const;

export const strategyHookAbi = [
  {
    type: 'function',
    name: 'calculateBuyFeeBps',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint128' }],
  },
  {
    type: 'function',
    name: 'calculateSellFeeBps',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint128' }],
  },
  {
    type: 'function',
    name: 'launchTimestamp',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export const v4SwapExecutorAbi = [
  {
    type: 'function',
    name: 'swapExactIn',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'key',
        type: 'tuple',
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' },
        ],
      },
      { name: 'zeroForOne', type: 'bool' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minAmountOut', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;

export const stratTokenAbi = [
  {
    type: 'function',
    name: 'tradingEnabled',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  ...erc20Abi,
] as const;

export const buybackManagerAbi = [
  {
    type: 'function',
    name: 'totalStratBurned',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'pendingUSDG',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'buybackThreshold',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'canTriggerBuyback',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'canTrigger', type: 'bool' },
      { name: 'pending', type: 'uint256' },
      { name: 'threshold', type: 'uint256' },
    ],
  },
] as const;

export const feeCollectorAbi = [
  {
    type: 'function',
    name: 'totalFeesReceived',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export const lotManagerAbi = [
  {
    type: 'function',
    name: 'lotThreshold',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export const stateViewAbi = [
  {
    type: 'function',
    name: 'getSlot0',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'bytes32' }],
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'protocolFee', type: 'uint24' },
      { name: 'lpFee', type: 'uint24' },
    ],
  },
] as const;

export const lotReaderAbi = [
  {
    type: 'function',
    name: 'getActiveLots',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'lotId', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'usdgAmount', type: 'uint256' },
          { name: 'nvdaAmount', type: 'uint256' },
          { name: 'nvdaToDividends', type: 'uint256' },
          { name: 'lpTokenId', type: 'uint256' },
          { name: 'tickLower', type: 'int24' },
          { name: 'tickUpper', type: 'int24' },
          { name: 'currentTick', type: 'int24' },
          { name: 'sellAtSqrtPriceX96', type: 'uint160' },
          { name: 'fullyConverted', type: 'bool' },
          { name: 'openedAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getClosedLots',
    stateMutability: 'view',
    inputs: [
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' },
    ],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'lotId', type: 'uint256' },
          { name: 'usdgInvested', type: 'uint256' },
          { name: 'usdgReceived', type: 'uint256' },
          { name: 'nvdaPurchased', type: 'uint256' },
          { name: 'nvdaToDividends', type: 'uint256' },
          { name: 'tickLower', type: 'int24' },
          { name: 'tickUpper', type: 'int24' },
          { name: 'openedAt', type: 'uint256' },
          { name: 'closedAt', type: 'uint256' },
        ],
      },
      { name: 'total', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'getClosedLotsTotals',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'closedCount', type: 'uint256' },
      { name: 'totalUsdgInvested', type: 'uint256' },
      { name: 'totalUsdgReceived', type: 'uint256' },
    ],
  },
] as const;

export const treasuryAbi = [
  {
    type: 'function',
    name: 'currentEpoch',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getCurrentClaimableEpoch',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'epochs',
    stateMutability: 'view',
    inputs: [{ name: 'epochId', type: 'uint256' }],
    outputs: [
      { name: 'epochId', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'totalDividends', type: 'uint256' },
      { name: 'claimedAmount', type: 'uint256' },
      { name: 'merkleRoot', type: 'bytes32' },
      { name: 'isFinalized', type: 'bool' },
      { name: 'isClaimable', type: 'bool' },
      { name: 'rolloverProcessed', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'userClaims',
    stateMutability: 'view',
    inputs: [
      { name: 'epochId', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    outputs: [
      { name: 'weightedBalance', type: 'uint256' },
      { name: 'claimAmount', type: 'uint256' },
      { name: 'hasClaimed', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'claimDividends',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'epochId', type: 'uint256' },
      { name: 'weightedBalance', type: 'uint256' },
      { name: 'claimAmount', type: 'uint256' },
      { name: 'merkleProof', type: 'bytes32[]' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'epochDuration',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

/** LotManager.LotStatus — Accumulating → Ready → NvdaPurchased → LPActive → Closed */
export const LOT_STATUS_LABELS: Record<number, string> = {
  0: 'Accumulating',
  1: 'Ready',
  2: 'NvdaPurchased',
  3: 'LPActive',
  4: 'Closed',
};

export const POOL_FEE_BPS = 30;
export const SLIPPAGE_BUFFER_BPS = 50;
/** Defaults match StrategyHook (flat 10% buy/sell; admin can restore decay via setFeeParams). */
export const STARTING_BUY_FEE_BPS = 1000;
export const RESTING_BUY_FEE_BPS = 1000;
export const FEE_DECAY_BPS_PER_MIN = 100;
