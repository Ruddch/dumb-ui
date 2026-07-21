import { env } from '../config/env';

export const TWITTER_URL = 'https://x.com/DumbMoneyGroup';

const POSM =
  (import.meta.env.VITE_POSITION_MANAGER as string | undefined) ||
  '0x58daec3116aae6D93017bAAea7749052E8a04fA7';

export function uniswapV4PositionUrl(tokenId: bigint): string {
  return `https://app.uniswap.org/positions/v4/${env.chainId}/${tokenId.toString()}`;
}

export function positionNftExplorerUrl(tokenId: bigint): string {
  return `https://robinhoodchain.blockscout.com/token/${POSM}/instance/${tokenId.toString()}`;
}
