# FilecoinTLDR Builder Challenge Submission

## Project title

Filecoin Dead Drop

## Short description

Filecoin Dead Drop is a tiny treasure-hunt app where someone seals a clue into Filecoin storage and shares the PieceCID as the dead-drop key. Anyone who holds the PieceCID can paste it back into the app to retrieve and reveal the clue.

## Main mechanic

Seal -> Share PieceCID -> Reveal.

The app has one job: turn a clue into a Filecoin-backed dead drop where the PieceCID is the product experience.

## How the app uses Filecoin / FOC

The server includes a Synapse SDK adapter. In live mode, sealing a clue calls:

```js
const result = await synapse.storage.upload(bytes);
```

The app displays the resulting PieceCID, completion status, and provider-copy count as a visible storage receipt.

Revealing a clue calls:

```js
const downloadedData = await synapse.storage.download({ pieceCid });
```

Mock mode is included so judges can test the full user experience without requiring a private key in the browser. Setting `SYNAPSE_PRIVATE_KEY` switches the same API routes to Synapse SDK mode.

## Live demo link

TBD after deployment.

## Repo link

TBD after pushing to GitHub.

## Demo flow

1. Open Filecoin Dead Drop.
2. Keep the sample clue or write a new one.
3. Click `Seal to Filecoin`.
4. Show the PieceCID receipt.
5. Paste/copy the PieceCID into the reveal panel.
6. Click `Reveal clue`.
7. The stored payload is retrieved and shown.

## AI build log

- Used AI to extract the challenge requirements and judging criteria from the FilecoinTLDR guide and Loops House page.
- Brainstormed non-generic Filecoin product mechanics and selected a dead-drop game because the CID is user-facing.
- Built a minimal Node + static frontend prototype with no heavy framework dependency.
- Added a Synapse SDK path for live FOC storage and a mock path for reliable judging demos.
- Added smoke testing for the core seal/reveal loop.

## Public X post draft

I built Filecoin Dead Drop for the @FilecoinTLDR Builder Challenge.

Seal a clue -> share the PieceCID -> reveal it from Filecoin storage.

The CID is the mechanic, not a hidden backend detail.

Demo: {LIVE_DEMO_LINK}
Repo: {REPO_LINK}

@Filecoin
