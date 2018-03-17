function onInterfaceReady() {
  console.log('FR ON READY');
  chrome.runtime.sendMessage({
    action: 'INTERFACE_READY'
  });
}

function onJiraRequest(ev) {
  chrome.runtime.sendMessage({
    action: 'JIRA_REQUEST',
    source: ev.detail
  });
}

chrome.runtime.onMessage.addListener((request) => {
  console.log(request);

  const ev = new CustomEvent('SP_JIRA_RESPONSE', {
    detail: request,
  });
  console.log('DISPATCH_CONTENT_SCRIPT', ev);
  window.dispatchEvent(ev);
});

window.addEventListener('APP_READY', onInterfaceReady);
window.addEventListener('SP_JIRA_REQUEST', onJiraRequest);

// set permanent info for frontend
window.localStorage.setItem('SUPER_PRODUCTIVITY_CHROME_EXTENSION', 'IS_ENABLED');
