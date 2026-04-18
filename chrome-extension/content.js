// Runs on the Ghostie web app — reads the token from localStorage and syncs it.
(function syncToken() {
  const token = localStorage.getItem('ghostie_token');
  if (token) {
    chrome.runtime.sendMessage({ type: 'GHOSTIE_SET_TOKEN', token }).catch(() => {});
  }
})();
