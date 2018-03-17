function onInterfaceReady() {
  console.log('FR ON READY');

  chrome.runtime.sendMessage({
    action: 'INTERFACE_READY',
    source: 'WHATEVER'
  });
}

function onJiraRequest(ev) {
  console.log('EVT_FR_JIRA');
  console.log(ev);

  chrome.runtime.sendMessage({
    action: 'JIRA_REQUEST',
    source: ev.detail
  });
}

window.addEventListener('APP_READY', onInterfaceReady);
window.addEventListener('SP_JIRA_REQUEST', onJiraRequest);

// set permanent info for frontend
window.localStorage.setItem('SUPER_PRODUCTIVITY_CHROME_EXTENSION', 'IS_ENABLED');
