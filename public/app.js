const sealForm = document.querySelector('#sealForm');
const revealForm = document.querySelector('#revealForm');
const toast = document.querySelector('#toast');
const modeStatus = document.querySelector('#modeStatus');
const emptyReceipt = document.querySelector('#emptyReceipt');
const receiptBody = document.querySelector('#receiptBody');
const receiptMode = document.querySelector('#receiptMode');
const receiptCopies = document.querySelector('#receiptCopies');
const receiptTime = document.querySelector('#receiptTime');
const pieceCid = document.querySelector('#pieceCid');
const copyCid = document.querySelector('#copyCid');
const revealCid = document.querySelector('#revealCid');
const revealResult = document.querySelector('#revealResult');
const dropTitle = document.querySelector('#dropTitle');
const dropClue = document.querySelector('#dropClue');
const dropMeta = document.querySelector('#dropMeta');

let currentCid = '';
let toastTimer;

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function setBusy(form, busy) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = busy;
  button.textContent = busy ? 'Working...' : button.dataset.label;
}

async function api(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'Request failed.');
  return data;
}

async function loadStatus() {
  const response = await fetch('/api/status');
  const data = await response.json();
  modeStatus.textContent =
    data.mode === 'synapse'
      ? 'Live Synapse mode: storing and retrieving through Filecoin Onchain Cloud.'
      : 'Demo mode: full flow works locally; add SYNAPSE_PRIVATE_KEY for live Filecoin storage.';
}

sealForm.querySelector('button[type="submit"]').dataset.label = 'Seal to Filecoin';
revealForm.querySelector('button[type="submit"]').dataset.label = 'Reveal clue';

sealForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setBusy(sealForm, true);
  try {
    const formData = new FormData(sealForm);
    const result = await api('/api/seal', Object.fromEntries(formData.entries()));
    currentCid = result.pieceCid;
    emptyReceipt.classList.add('hidden');
    receiptBody.classList.remove('hidden');
    receiptMode.textContent = result.mode === 'synapse' ? 'Synapse SDK' : 'Mock demo';
    receiptCopies.textContent = `${result.copies} provider copies`;
    receiptTime.textContent = new Date(result.sealedAt).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    pieceCid.textContent = result.pieceCid;
    revealCid.value = result.pieceCid;
    showToast('Dead drop sealed. The PieceCID is now the key.');
  } catch (error) {
    showToast(error.message);
  } finally {
    setBusy(sealForm, false);
  }
});

revealForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setBusy(revealForm, true);
  try {
    const formData = new FormData(revealForm);
    const result = await api('/api/reveal', Object.fromEntries(formData.entries()));
    dropTitle.textContent = result.drop.title;
    dropClue.textContent = result.drop.clue;
    dropMeta.textContent = `${result.mode === 'synapse' ? 'Retrieved through Synapse SDK' : 'Retrieved from local demo store'} · sealed ${new Date(result.drop.sealedAt).toLocaleString()} · ${result.drop.revealRule}`;
    revealResult.classList.remove('hidden');
    showToast('Dead drop revealed from its PieceCID.');
  } catch (error) {
    showToast(error.message);
  } finally {
    setBusy(revealForm, false);
  }
});

copyCid.addEventListener('click', async () => {
  if (!currentCid) return;
  await navigator.clipboard.writeText(currentCid);
  showToast('PieceCID copied.');
});

loadStatus().catch(() => {
  modeStatus.textContent = 'Storage mode unavailable.';
});
