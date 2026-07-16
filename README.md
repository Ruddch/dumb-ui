# DUMP MONEY UI

Retro-forum frontend for **NVDA Strategy v2** on Robinhood Chain (4663). Brand: **DUMB MONEY**. Mechanics: real on-chain NVDASTR/USDG swaps, protocol stats, lots dashboard, charts.

## Stack

- Vite + React + TypeScript
- React Router
- wagmi v2 + viem
- CSS ported from `Design-a-landing-page-for-a-crypto-platform/`

## Setup

```bash
cd dump-money-ui
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

## Pages

| Route | Description |
|---|---|
| `/` | Landing — rules, NVDA Strategy flywheel, compact swap widget |
| `/swap` | Full swap desk — USDG ↔ NVDASTR, live hook fee, auto slippage |
| `/lots` | Protocol lots via LotReader (requires deploy) |
| `/charts` | NVDASTR/USDG + NVDA/USDG live spot + illustrative SVG charts |
| `/claim` | TreasuryV2 Merkle dividend claims (**NVDA**) |

## Wallet

Connect MetaMask/Rabby. App expects **Robinhood Chain (4663)**. Use the member bar to switch network.

## Swap

- **Buy:** pay USDG → receive NVDASTR (`zeroForOne=true`)
- **Sell:** pay NVDASTR → receive USDG (`zeroForOne=false`)
- Hook fee read live from `StrategyHook.calculateBuyFeeBps()` / `calculateSellFeeBps()`
- **Auto slippage** = pool 0.3% + hook fee + price impact + 0.5% buffer
- Approves then swaps via `V4SwapExecutor.swapExactIn`

## Dividends (`/claim`)

TreasuryV2 pays **NVDA** (not USDG) in epochs (default 7 days). On each lot execute, 20% of purchased NVDA goes to Treasury. After owner finalizes an epoch with a Merkle root, holders claim via `claimDividends(epochId, weightedBalance, claimAmount, proof)`.

Host a manifest JSON per epoch and set:

```
VITE_DIVIDENDS_MANIFEST_URL=https://your-host/dividends/epoch-{epochId}.json
```

Manifest format (see `public/dividends/example-manifest.json`). `claimAmount` is in **NVDA** human units (18 decimals on-chain).

Leaf: `keccak256(abi.encodePacked(address, weightedBalance, claimAmount))` with raw uint256 values.

Manual proof paste is supported if no manifest URL is set.

## Protocol model (v2)

- Hook fees: flat **10%** buy/sell by default (20% ops / 80% FeeCollector → LotManager)
- Lot execute: **80%** NVDA → concentrated LP below price · **20%** NVDA → Treasury
- Lot statuses: `Accumulating → Ready → NvdaPurchased → LPActive → Closed`
- Stale: `repositionStaleLot` force-closes + liquidates to buyback (not a range re-open)

## LotReader (for /lots page)

`VITE_LOT_READER` is empty until deployed:

```bash
cd ../contracts
source .env.deploy   # PRIVATE_KEY, LOT_MANAGER, etc.
forge script script/DeployLotReader.s.sol --rpc-url $ROBINHOOD_RPC_URL --broadcast
```

Copy the logged `LotReader:` address into `dump-money-ui/.env`:

```
VITE_LOT_READER=0x...
```

## Env vars

See `.env.example`. All addresses match `contracts/.env.deploy.example` (NVDASTR deployment).

Thresholds (`lotThreshold`, `buybackThreshold`) are read on-chain — not hardcoded.

## Build

```bash
npm run build
npm run preview
```

Production env is baked from `.env.production` (public contract addresses). Override locally with `.env` / `.env.local` (gitignored).

## GitHub Pages (`dumbmoney.online`)

CI deploys on push to `main` / `master` via [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). `public/CNAME` pins the custom domain; build uses `BASE_PATH=/`.

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source:** GitHub Actions.
3. **Settings → Pages → Custom domain:** `dumbmoney.online` (check **Enforce HTTPS** after DNS propagates).
4. At the DNS provider for `dumbmoney.online`, point apex (and optionally `www`) at GitHub Pages:

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |
| `AAAA` | `@` | `2606:50c0:8000::153` |
| `AAAA` | `@` | `2606:50c0:8001::153` |
| `AAAA` | `@` | `2606:50c0:8002::153` |
| `AAAA` | `@` | `2606:50c0:8003::153` |
| `CNAME` | `www` | `<user>.github.io` |

SPA deep links work via a `404.html` copy of `index.html` (written at build time).

## Protocol reference

See `../contracts/README.md` for architecture, lot lifecycle, keeper, and fee split.
