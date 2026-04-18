const API_BASE = 'https://be42y0pdjd.execute-api.ap-southeast-2.amazonaws.com/Prod';
const APP_URL  = 'https://ghostie.pages.dev';

// ── Helpers ──────────────────────────────────────────────────────────────────

function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

// Strips subdomains and TLD to get the root brand name.
// aws.amazon.com → Amazon, store.tesla.com → Tesla, reddit.com → Reddit
function domainToCompany(hostname) {
  const parts = hostname.replace(/^www\./, '').split('.');
  // Handle multi-part TLDs like co.uk, com.au
  const multiTld = parts.length >= 3 && parts[parts.length - 2].length <= 3;
  const brandPart = multiTld ? parts[parts.length - 3] : parts[parts.length - 2];
  return brandPart.charAt(0).toUpperCase() + brandPart.slice(1);
}

function scoreColor(s) {
  if (s >= 57.5) return 'hsl(142,69%,58%)';
  if (s >= 42.5) return 'hsl(45,93%,58%)';
  return 'hsl(0,84%,60%)';
}

function sentimentLabel(s) {
  if (s >= 57.5) return ['Positive', 'positive'];
  if (s >= 42.5) return ['Neutral', 'neutral'];
  return ['Negative', 'negative'];
}

function isNoDataError(msg) {
  return msg.toLowerCase().includes('no collected data') ||
    msg.toLowerCase().includes('run post') ||
    msg.toLowerCase().includes('store first') ||
    msg.toLowerCase().includes('not found');
}

// ── Gauge ─────────────────────────────────────────────────────────────────────

function drawGauge(canvas, score) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h - 6;
  const r = 44;
  const startAngle = Math.PI;
  const filled = startAngle + (score / 100) * Math.PI;

  ctx.clearRect(0, 0, w, h);

  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.stroke();

  const color = scoreColor(score);
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, filled);
  ctx.strokeStyle = color;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ── Auth token ────────────────────────────────────────────────────────────────

async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['ghostie_token'], (res) => resolve(res.ghostie_token ?? null));
  });
}

async function saveToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ ghostie_token: token }, resolve);
  });
}

// ── API ───────────────────────────────────────────────────────────────────────

async function apiFetch(path, token, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.detail || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

async function fetchSentiment(businessName, location, category, token) {
  const params = new URLSearchParams({ business_name: businessName, location, category });
  return apiFetch(`/analytical-model/sentiment?${params}`, token);
}

async function collectData(businessName, location, category, token) {
  return apiFetch('/data-collection/collect', token, {
    method: 'POST',
    body: JSON.stringify({ business_name: businessName, location, category }),
  });
}

// ── State ─────────────────────────────────────────────────────────────────────

let currentResult   = null;
let pendingBusiness = null; // { businessName, location, category } waiting for collect

const SECTIONS = ['searchSection', 'loadingSection', 'resultSection', 'unscoredSection', 'errorSection', 'authSection'];

function showOnly(id) {
  SECTIONS.forEach((s) => (s === id ? show(s) : hide(s)));
}

function setLoadingText(text) {
  document.getElementById('loadingText').textContent = text;
}

function showUnscored(businessName) {
  document.getElementById('unscoredName').textContent = `"${businessName}" hasn't been scored yet`;
  showOnly('unscoredSection');
}

function showResult(data) {
  currentResult = data;
  const score = data.overall_score ?? 0;
  const [label, cls] = sentimentLabel(score);

  drawGauge(document.getElementById('gaugeCanvas'), score);

  const scoreEl = document.getElementById('scoreNumber');
  scoreEl.textContent = Math.round(score);
  scoreEl.style.color = scoreColor(score);

  const badgeEl = document.getElementById('scoreBadge');
  badgeEl.textContent = label;
  badgeEl.className = `score-label ${cls}`;

  document.getElementById('resultName').textContent = data.business_name ?? '—';
  document.getElementById('resultMeta').textContent =
    [data.location, data.category].filter(Boolean).join(' · ') || '—';
  document.getElementById('resultRating').textContent =
    data.overall_rating ? `${'⭐'.repeat(data.overall_rating)} (${data.overall_rating}/5)` : '';

  document.getElementById('statItems').textContent = data.items_analysed ?? '—';
  document.getElementById('statRating').textContent =
    data.overall_rating != null ? `${data.overall_rating}/5` : '—';

  const kwBox = document.getElementById('keywords');
  kwBox.innerHTML = '';
  (data.keywords ?? []).slice(0, 6).forEach((kw) => {
    const chip = document.createElement('span');
    chip.className = 'kw-chip';
    chip.textContent = kw;
    kwBox.appendChild(chip);
  });

  showOnly('resultSection');
}

// ── Analyse ───────────────────────────────────────────────────────────────────

function getFormValues() {
  return {
    businessName: document.getElementById('businessName').value.trim(),
    location:     document.getElementById('location').value.trim() || 'Global',
    category:     document.getElementById('category').value.trim() || 'General',
  };
}

async function analyse() {
  const { businessName, location, category } = getFormValues();
  if (!businessName) { document.getElementById('businessName').focus(); return; }

  const token = await getToken();
  if (!token) { showOnly('authSection'); return; }

  setLoadingText('Analysing sentiment…');
  showOnly('loadingSection');

  try {
    const data = await fetchSentiment(businessName, location, category, token);
    showResult(data);
  } catch (err) {
    if (err.status === 401) {
      await saveToken(null);
      showOnly('authSection');
    } else if (isNoDataError(err.message)) {
      pendingBusiness = { businessName, location, category };
      showUnscored(businessName);
    } else {
      document.getElementById('errorMsg').textContent = err.message || 'Failed to fetch sentiment.';
      showOnly('errorSection');
    }
  }
}

async function collectAndAnalyse() {
  if (!pendingBusiness) return;
  const { businessName, location, category } = pendingBusiness;

  const token = await getToken();
  if (!token) { showOnly('authSection'); return; }

  // Step 1: collect
  setLoadingText('Collecting data — this may take 30–60 seconds…');
  showOnly('loadingSection');

  try {
    await collectData(businessName, location, category, token);
  } catch (err) {
    if (err.status === 401) { await saveToken(null); showOnly('authSection'); return; }
    document.getElementById('errorMsg').textContent = `Collection failed: ${err.message}`;
    showOnly('errorSection');
    return;
  }

  // Step 2: analyse
  setLoadingText('Running sentiment analysis…');

  try {
    const data = await fetchSentiment(businessName, location, category, token);
    showResult(data);
  } catch (err) {
    document.getElementById('errorMsg').textContent = `Analysis failed: ${err.message}`;
    showOnly('errorSection');
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  // Auth buttons wired unconditionally
  document.getElementById('signInBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: `${APP_URL}/signin` });
  });
  document.getElementById('loginBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: `${APP_URL}/signin` });
  });

  const token = await getToken();
  if (!token) { showOnly('authSection'); return; }

  // Pre-fill from current tab domain
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const { hostname } = new URL(tab.url);
      if (hostname && !hostname.startsWith('chrome') && hostname !== 'newtab') {
        document.getElementById('businessName').value = domainToCompany(hostname);
      }
    }
  } catch { /* tab access restricted */ }

  showOnly('searchSection');

  document.getElementById('analyseBtn').addEventListener('click', analyse);
  document.getElementById('businessName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') analyse();
  });
  document.getElementById('resetBtn').addEventListener('click', () => showOnly('searchSection'));
  document.getElementById('retryBtn').addEventListener('click', () => showOnly('searchSection'));
  document.getElementById('unscoredBackBtn').addEventListener('click', () => showOnly('searchSection'));
  document.getElementById('collectBtn').addEventListener('click', collectAndAnalyse);

  document.getElementById('openBtn').addEventListener('click', () => {
    if (currentResult) {
      const url = `${APP_URL}/score/${encodeURIComponent(currentResult.business_name)}` +
        `?location=${encodeURIComponent(currentResult.location ?? '')}` +
        `&category=${encodeURIComponent(currentResult.category ?? '')}`;
      chrome.tabs.create({ url });
    } else {
      chrome.tabs.create({ url: APP_URL });
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
