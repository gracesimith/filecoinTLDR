const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3000';

const sealResponse = await fetch(`${baseUrl}/api/seal`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    title: 'Smoke test dead drop',
    clue: 'This is a smoke-test clue sealed for the Filecoin Dead Drop flow.',
    revealRule: 'Paste the PieceCID back to reveal.',
  }),
});

const sealed = await sealResponse.json();
if (!sealResponse.ok || !sealed.pieceCid) {
  throw new Error(`Seal failed: ${JSON.stringify(sealed)}`);
}

const revealResponse = await fetch(`${baseUrl}/api/reveal`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ pieceCid: sealed.pieceCid }),
});

const revealed = await revealResponse.json();
if (!revealResponse.ok || revealed.drop?.title !== 'Smoke test dead drop') {
  throw new Error(`Reveal failed: ${JSON.stringify(revealed)}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: sealed.mode,
      pieceCid: sealed.pieceCid,
      revealedTitle: revealed.drop.title,
    },
    null,
    2
  )
);
