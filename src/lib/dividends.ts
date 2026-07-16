import { env } from '../config/env';

export type DividendClaimEntry = {
  weightedBalance: string;
  claimAmount: string;
  proof: `0x${string}`[];
};

export type DividendManifest = {
  epochId: number;
  merkleRoot?: string;
  claims: Record<string, DividendClaimEntry>;
};

export function manifestUrlForEpoch(epochId: bigint | number): string | null {
  const template = env.dividendsManifestUrl;
  if (!template) return null;
  return template.replace('{epochId}', String(epochId));
}

export async function fetchDividendManifest(epochId: bigint): Promise<DividendManifest | null> {
  const url = manifestUrlForEpoch(epochId);
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json() as Promise<DividendManifest>;
}

export function lookupClaim(manifest: DividendManifest, address: string): DividendClaimEntry | null {
  const key = address.toLowerCase();
  return manifest.claims[key] ?? manifest.claims[address] ?? null;
}

export function parseProofText(text: string): `0x${string}`[] {
  return text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('0x'))
    .map((s) => s as `0x${string}`);
}
