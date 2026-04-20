(function () {
  // Only inject once
  if (document.getElementById('ghostie-overlay-root')) return;

  // ── Styles ──────────────────────────────────────────────────────────────────

  const style = document.createElement('style');
  style.textContent = `
    #ghostie-overlay-root {
      all: initial;
      position: fixed;
      z-index: 2147483647;
      bottom: 24px;
      right: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
    }

    #ghostie-overlay-card {
      background: hsl(228,38%,13%);
      border: 1px solid hsl(230,25%,25%);
      border-radius: 14px;
      padding: 16px;
      width: 300px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      color: hsl(210,40%,93%);
      animation: ghostie-slide-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
    }

    @keyframes ghostie-slide-in {
      from { opacity: 0; transform: translateY(16px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    #ghostie-overlay-card.ghostie-hiding {
      animation: ghostie-slide-out 0.2s ease forwards;
    }

    @keyframes ghostie-slide-out {
      to { opacity: 0; transform: translateY(12px) scale(0.96); }
    }

    .ghostie-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .ghostie-logo {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 13px;
      color: hsl(210,40%,93%);
    }

    .ghostie-close {
      background: none;
      border: none;
      cursor: pointer;
      color: hsl(215,20%,55%);
      font-size: 16px;
      line-height: 1;
      padding: 2px 4px;
      border-radius: 4px;
      transition: color 0.15s, background 0.15s;
    }
    .ghostie-close:hover { color: hsl(210,40%,93%); background: rgba(255,255,255,0.08); }

    .ghostie-loading {
      display: flex;
      align-items: center;
      gap: 10px;
      color: hsl(215,20%,60%);
      padding: 4px 0;
    }

    .ghostie-spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.1);
      border-top-color: hsl(142,69%,58%);
      border-radius: 50%;
      animation: ghostie-spin 0.8s linear infinite;
      flex-shrink: 0;
    }
    @keyframes ghostie-spin { to { transform: rotate(360deg); } }

    .ghostie-score-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .ghostie-score-num {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -1px;
      line-height: 1;
    }

    .ghostie-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ghostie-badge-positive { background: hsla(142,69%,58%,0.15); color: hsl(142,69%,58%); border: 1px solid hsla(142,69%,58%,0.3); }
    .ghostie-badge-neutral  { background: hsla(45,93%,58%,0.15);  color: hsl(45,93%,58%);  border: 1px solid hsla(45,93%,58%,0.3); }
    .ghostie-badge-negative { background: hsla(0,84%,60%,0.15);   color: hsl(0,84%,60%);   border: 1px solid hsla(0,84%,60%,0.3); }

    .ghostie-bar-track {
      height: 5px;
      border-radius: 3px;
      background: rgba(255,255,255,0.08);
      overflow: hidden;
      margin-bottom: 12px;
    }
    .ghostie-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
    }

    .ghostie-summary {
      font-size: 12px;
      color: hsl(215,20%,72%);
      line-height: 1.6;
      border-top: 1px solid hsl(230,25%,22%);
      padding-top: 10px;
    }

    .ghostie-excerpt {
      font-size: 11px;
      color: hsl(215,20%,50%);
      border-left: 2px solid hsl(230,25%,30%);
      padding-left: 8px;
      margin-bottom: 10px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      font-style: italic;
    }

    .ghostie-error {
      font-size: 12px;
      color: hsl(0,84%,65%);
      background: hsla(0,84%,60%,0.1);
      border: 1px solid hsla(0,84%,60%,0.25);
      border-radius: 8px;
      padding: 8px 10px;
    }
  `;
  document.head.appendChild(style);

  // ── DOM (created lazily on first message) ────────────────────────────────────

  let root = null;
  let card = null;

  function ensureDOM() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'ghostie-overlay-root';
    card = document.createElement('div');
    card.id = 'ghostie-overlay-card';
    root.appendChild(card);
    document.body.appendChild(root);
  }

  let hideTimer = null;

  function scheduleHide(ms = 8000) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideCard, ms);
  }

  function hideCard() {
    if (!root) return;
    card.classList.add('ghostie-hiding');
    card.addEventListener('animationend', () => { root.remove(); root = null; card = null; }, { once: true });
  }

  function showCard() {
    ensureDOM();
    card.classList.remove('ghostie-hiding');
  }

  function scoreColor(s) {
    if (s >= 57.5) return 'hsl(142,69%,58%)';
    if (s >= 42.5) return 'hsl(45,93%,58%)';
    return 'hsl(0,84%,60%)';
  }

  function sentimentClass(s) {
    if (s >= 57.5) return ['Positive', 'ghostie-badge-positive'];
    if (s >= 42.5) return ['Neutral',  'ghostie-badge-neutral'];
    return ['Negative', 'ghostie-badge-negative'];
  }

  function renderHeader() {
    return `
      <div class="ghostie-header">
        <div class="ghostie-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C7.03 2 3 6.03 3 11v9l3-3 3 3 3-3 3 3 3-3v-9c0-4.97-4.03-9-9-9z" fill="url(#go)"/>
            <circle cx="9" cy="11" r="1.4" fill="hsl(228,38%,13%)"/>
            <circle cx="15" cy="11" r="1.4" fill="hsl(228,38%,13%)"/>
            <defs>
              <linearGradient id="go" x1="3" y1="2" x2="21" y2="20" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="hsl(142,69%,45%)"/>
                <stop offset="100%" stop-color="hsl(200,80%,50%)"/>
              </linearGradient>
            </defs>
          </svg>
          Ghostie
        </div>
        <button class="ghostie-close" id="ghostie-close-btn" title="Dismiss">✕</button>
      </div>
    `;
  }

  function renderLoading() {
    ensureDOM();
    card.innerHTML = renderHeader() + `
      <div class="ghostie-loading">
        <div class="ghostie-spinner"></div>
        <span>Analysing sentiment…</span>
      </div>
    `;
    wireClose();
    showCard();
    clearTimeout(hideTimer);
  }

  function renderResult(data, originalText) {
    ensureDOM();
    const score   = data.score ?? 0;
    const color   = scoreColor(score);
    const [label, cls] = sentimentClass(score);
    const rating  = data.rating ? '⭐'.repeat(data.rating) : '';
    const excerpt = originalText?.slice(0, 120) + (originalText?.length > 120 ? '…' : '');

    card.innerHTML = renderHeader() + `
      ${excerpt ? `<div class="ghostie-excerpt">${excerpt}</div>` : ''}
      <div class="ghostie-score-row">
        <span class="ghostie-score-num" style="color:${color}">${Math.round(score)}</span>
        <span style="color:${color};font-size:11px;font-weight:600">/100</span>
        <span class="ghostie-badge ${cls}">${label}</span>
      </div>
      <div class="ghostie-bar-track">
        <div class="ghostie-bar-fill" id="ghostie-bar" style="width:0%;background:${color};box-shadow:0 0 8px ${color}60"></div>
      </div>
      ${rating ? `<div class="ghostie-summary">${rating} (${data.rating}/5)</div>` : ''}
    `;

    wireClose();
    showCard();

    // Animate bar after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const bar = document.getElementById('ghostie-bar');
        if (bar) bar.style.width = `${score}%`;
      });
    });

    scheduleHide(10000);
  }

  function renderError(message) {
    ensureDOM();
    card.innerHTML = renderHeader() + `<div class="ghostie-error">${message}</div>`;
    wireClose();
    showCard();
    scheduleHide(6000);
  }

  function wireClose() {
    document.getElementById('ghostie-close-btn')?.addEventListener('click', hideCard);
  }

  // ── Message listener ────────────────────────────────────────────────────────

  let lastSelectedText = '';
  document.addEventListener('mouseup', () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel) lastSelectedText = sel;
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'GHOSTIE_OVERLAY_LOADING') {
      renderLoading();
    } else if (msg.type === 'GHOSTIE_OVERLAY_RESULT') {
      if (msg.result.error) {
        renderError(msg.result.error);
      } else {
        renderResult(msg.result.data, lastSelectedText);
      }
    }
  });
})();
