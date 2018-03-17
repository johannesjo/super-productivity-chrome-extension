function onJiraRequest(ev) {
  chrome.runtime.sendMessage({
    action: 'JIRA_REQUEST',
    source: ev.detail
  });
}

chrome.runtime.onMessage.addListener((request) => {
  const ev = new CustomEvent('SP_JIRA_RESPONSE', {
    detail: request,
  });
  window.dispatchEvent(ev);
});

window.addEventListener('SP_JIRA_REQUEST', onJiraRequest);

// set permanent info for frontend
window.localStorage.setItem('SUPER_PRODUCTIVITY_CHROME_EXTENSION', 'IS_ENABLED');
