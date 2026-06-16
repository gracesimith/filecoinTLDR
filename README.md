# Filecoin Dead Drop

Filecoin Dead Drop is a tiny Filecoin-powered game for the FilecoinTLDR Builder Challenge.

One clear mechanic: seal a clue, share the PieceCID, reveal the clue by pasting that PieceCID back.

## Why this fits the challenge

- Product concept: a treasure-hunt style dead drop where the CID is the object players trade.
- Clear mechanic: Seal -> Share PieceCID -> Reveal.
- Filecoin primitive: Synapse SDK storage upload and retrieval, with PieceCID, provider copies, and retrieval status shown directly in the UI.
- Memorable angle: Filecoin becomes the key to a secret, not a hidden file bucket.
- MVP: one page, one clue form, one receipt, one reveal form.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app runs in mock mode by default so the full product flow works without testnet funds or a private key.

## Live demo

- App: https://gracesimith.github.io/filecoinTLDR/
- Demo video: https://raw.githubusercontent.com/gracesimith/filecoinTLDR/main/assets/filecoin-dead-drop-demo.mp4
- Repo: https://github.com/gracesimith/filecoinTLDR
- Public X post: https://x.com/gs197287/status/2066737467404013682

## Use live Synapse SDK mode

Install dependencies, then run with a Filecoin wallet private key that is funded/configured for Filecoin Onchain Cloud:

```bash
SYNAPSE_PRIVATE_KEY=0x... npm run dev
```

The server switches `/api/seal` to:

```js
const result = await synapse.storage.upload(bytes);
```

and `/api/reveal` to:

```js
const downloadedData = await synapse.storage.download({ pieceCid });
```

The implementation follows the Filecoin Onchain Cloud Quick Start with Synapse SDK.

## Test

With the app running:

```bash
npm run check
```

## 60-90 second demo flow

1. Open the app and point to the single mechanic: Seal -> Share PieceCID -> Reveal.
2. Type or keep the sample clue and click `Seal to Filecoin`.
3. Show the storage receipt: mode, provider copies, sealed time, and PieceCID.
4. Copy the PieceCID into the reveal panel.
5. Click `Reveal clue`.
6. Explain that in live mode the same flow uses Synapse SDK upload/download; in demo mode the app preserves the UX without exposing a private key in the browser.

## AI build log

- Used AI to read the challenge brief and extract the judging criteria.
- Chose a non-generic storage mechanic where the CID is the user-facing key.
- Scoped the build to a small Node server plus static UI to keep the prototype shippable.
- Added a mock mode for reliable judging demos and a Synapse adapter for real Filecoin storage.
- Wrote a smoke test that proves seal and reveal work end to end.

## Submission draft

Project title: Filecoin Dead Drop

Short description: A tiny treasure-hunt app where users seal a clue into Filecoin storage and share the PieceCID as the dead-drop key. Pasting the PieceCID retrieves and reveals the clue.

How it uses Filecoin / FOC: The product revolves around Synapse SDK storage. Sealing a clue calls `storage.upload` and returns a PieceCID plus storage-copy metadata; revealing calls `storage.download({ pieceCid })`. The PieceCID is the visible gameplay object.

Main mechanic: Seal a clue, share the PieceCID, reveal the clue by PieceCID.

Public X post:

https://x.com/gs197287/status/2066737467404013682
