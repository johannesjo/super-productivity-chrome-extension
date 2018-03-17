function onInterfaceReady() {
  console.log('FR ON_INTER');

  chrome.runtime.sendMessage({
    action: 'interfaceReady',
    source: 'WHATEVER'
  });

  window.addEventListener('SP_JIRA_REQUEST', (ev) => {
    chrome.runtime.sendMessage({
      action: 'jirRequest',
      source: ['WHATEVER', 'MORE']
    });
  });
}

window.addEventListener('APP_READY', onInterfaceReady);

// set permanent info for frontend
window.localStorage.setItem('SUPER_PRODUCTIVITY_CHROME_EXTENSION', 'IS_ENABLED');
