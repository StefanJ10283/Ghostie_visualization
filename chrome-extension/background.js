const API_BASE = 'https://be42y0pdjd.execute-api.ap-southeast-2.amazonaws.com/Prod';

// MV3 service workers surface Chrome-internal messaging rejections that can't
// be caught at the call site. Suppress the known connection error globally.
self.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Could not establish connection')) {
    event.preventDefault();
  }
});

// ── Token sync ────────────────────────────────────────────────────────────────

function safeRespond(sendResponse, data) {
  try { sendResponse(data); } catch { /* sender already closed */ }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'GHOSTIE_SET_TOKEN' && typeof msg.token === 'string') {
    chrome.storage.local.set({ ghostie_token: msg.token }, () => safeRespond(sendResponse, { ok: true }));
    return true;
  }
  if (msg?.type === 'ANALYSE_TEXT') {
    analyseText(msg.text).then((result) => safeRespond(sendResponse, result));
    return true;
  }
});

chrome.runtime.onMessageExternal.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'GHOSTIE_SET_TOKEN' && typeof msg.token === 'string') {
    chrome.storage.local.set({ ghostie_token: msg.token }, () => safeRespond(sendResponse, { ok: true }));
    return true;
  }
});

// ── Context menu ──────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ghostie-analyse-text',
    title: 'Analyse sentiment with Ghostie',
    contexts: ['selection'],
  });
});

function sendToTab(tabId, msg) {
  chrome.tabs.sendMessage(tabId, msg, () => {
    if (!chrome.runtime.lastError) return;
    // Overlay not injected yet — inject then retry
    chrome.scripting.executeScript({ target: { tabId }, files: ['overlay.js'] }, () => {
      if (chrome.runtime.lastError) return; // restricted page, give up
      chrome.tabs.sendMessage(tabId, msg, () => { chrome.runtime.lastError; });
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'ghostie-analyse-text') return;
  const text = info.selectionText?.trim();
  if (!text || !tab?.id) return;

  sendToTab(tab.id, { type: 'GHOSTIE_OVERLAY_LOADING' });

  analyseText(text).then((result) => {
    sendToTab(tab.id, { type: 'GHOSTIE_OVERLAY_RESULT', result });
  }).catch(() => {});
});

// ── Text sentiment API call ───────────────────────────────────────────────────

async function analyseText(text) {
  try {
    const { ghostie_token: token } = await chrome.storage.local.get(['ghostie_token']);
    if (!token) return { error: 'Not signed in. Open the Ghostie extension to sign in.' };

    const params = new URLSearchParams({ text });
    const res = await fetch(`${API_BASE}/analytical-model/analyse?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      await chrome.storage.local.remove('ghostie_token');
      return { error: 'Session expired. Please sign in again.' };
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.detail || `Error ${res.status}` };
    }

    return { data: await res.json() };
  } catch (e) {
    return { error: e.message || 'Request failed.' };
  }
}
