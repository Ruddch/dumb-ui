import { defineChain } from 'viem';
import { env } from '../config/env';

export const robinhoodChain = defineChain({
  id: env.chainId,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [env.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.robinhood.com' },
  },
});
