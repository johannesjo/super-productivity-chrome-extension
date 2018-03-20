// prevent multiple injections (should only happen during development)
if (!window.isSupExtensionInjected) {
  window.isSupExtensionInjected = true;
  window.supExtensionEventListeners = [];
  init();
} else {
  console.warn('SP-EXT: Content Script Injection blocked. Reinitializing...');
  removeEventListeners();
  init();
}

function onJiraRequest(ev) {
  chrome.runtime.sendMessage({
    action: 'JIRA_REQUEST',
    source: ev.detail
  });
}

function attachEventListenerForApp(evName, evHandlerFn) {
  const evObj = {};
  evObj[evName] = evHandlerFn;
  window.supExtensionEventListeners.push(evObj);
  window.addEventListener(evName, evHandlerFn);
}

function init() {
  console.log('SPEX injected');

  chrome.runtime.onMessage.addListener((request) => {
    const ev = new CustomEvent('SP_JIRA_RESPONSE', {
      detail: request,
    });
    window.dispatchEvent(ev);
  });

  attachEventListenerForApp('SP_JIRA_REQUEST', onJiraRequest);

// set permanent info for frontend
  window.localStorage.setItem('SUPER_PRODUCTIVITY_CHROME_EXTENSION', 'IS_ENABLED');

  const initEv = new Event('SP_EXTENSION_READY');
  window.dispatchEvent(initEv);
// dispatch again just in case the page was not loaded yet
  setTimeout(() => {
    window.dispatchEvent(initEv);
  }, 3000);
  setTimeout(() => {
    window.dispatchEvent(initEv);
  }, 10000);
}

function removeEventListeners() {
  window.supExtensionEventListeners.forEach((evObj) => {
    const evName = Object.keys(evObj)[0];
    const evFn = evObj[evName];
    window.removeEventListener(evName, evFn);
  });

  window.supExtensionEventListeners = [];
}