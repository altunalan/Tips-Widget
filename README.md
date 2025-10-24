# MegaETH Tips Widget

A monorepo containing a MegaETH realtime tipping experience:

- **packages/contracts** – Hardhat Solidity project with the `TipsVault` contract.
- **packages/server** – Express API providing `/api/realtimeSend` using a server key to submit `tip` transactions.
- **packages/widget** – Frameworkless Web Component published as `<megaeth-tips>` for embedding anywhere.
- **packages/site** – React demo page served at `/demo` showcasing the tipping flow and recent tips feed.

## Getting started

```bash
pnpm install
```

Each workspace has its own scripts. Useful top-level commands:

```bash
pnpm lint
pnpm test
pnpm build
```

## Configuring the widget recipient

Set the recipient address when declaring the custom element:

```html
<megaeth-tips data-recipient="0xabc123..."></megaeth-tips>
```

Update the default contract address for both the widget and demo site in [`packages/widget/src/config.ts`](packages/widget/src/config.ts). After deploying a new contract, change `CONTRACT_ADDRESS` to the deployed `TipsVault` address and rebuild.

## Embedding the widget

1. Host `packages/widget/dist/widget.js` (built via `pnpm --filter @megaeth/widget build`).
2. Inline the script and element wherever you want the widget to appear:

```html
<script type="module" src="https://yourcdn.example/widget.js"></script>
<megaeth-tips data-recipient="0xabc123..."></megaeth-tips>
```

No additional frameworks are required; the custom element registers itself on import.

## Deploying the TipsVault contract

1. `cd packages/contracts`.
2. `pnpm build` (compiles the contract).
3. `pnpm hardhat run scripts/deploy.ts --network megaeth` (ensure `PRIVATE_KEY` is configured via Hardhat – see Hardhat docs).
4. Copy the deployed address into `packages/widget/src/config.ts` and any server `.env` files (`TIPS_VAULT_ADDRESS`).

## Server configuration

Create `packages/server/.env` with:

```
MEGAETH_RPC_URL=https://carrot.megaeth.com/rpc
MEGAETH_CHAIN_ID=6342
TIPS_VAULT_ADDRESS=0xyourvault
MEGAETH_SIGNER_KEY=0xyourprivatekey
PORT=3000
```

Run the server with `pnpm --filter @megaeth/server dev` (uses ts-node) or `pnpm --filter @megaeth/server start` after building.

## Realtime log pagination

`fetchRecentTips(address, { fromBlock?, cursor? })` issues a raw `eth_getLogsWithCursor` request against the MegaETH RPC. Provide:

- `fromBlock` (hex string) to set an explicit starting block.
- `cursor` to continue from a previous page; the RPC responds with `logs` and `nextCursor`. Pass `nextCursor` back into `fetchRecentTips` to request the next batch. When `nextCursor` is `undefined`, you are caught up with the latest events.

## Demo site

Run `pnpm --filter @megaeth/site dev` to serve `/demo`. The page includes:

- A React tipping form using the Express backend.
- The embedded `<megaeth-tips>` widget.
- A table of recent `TipSent` events powered by `fetchRecentTips` pagination.

