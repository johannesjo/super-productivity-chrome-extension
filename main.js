const action = 'search';
const base = 'https://test-sp-app.atlassian.net/rest/api/2';

function handleJiraRequest(tab) {
  console.log(tab);
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `${base}/${action}`, true);
  xhr.onload = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        console.log(res);
      } else {
        console.error(xhr.statusText);
      }
    }
  };
  xhr.onerror = function(e) {
    console.error(xhr.statusText);
  };
  xhr.send(null);
}

function initInterface(tabId) {
  chrome.tabs.executeScript(tabId, {
    file: 'frontend-interface.js',
    allFrames: true,
    runAt: 'document_idle'
  }, () => {
    // If you try and inject into an extensions page or the webstore/NTP you'll get an error
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    }
  });
}

// HELPER
// ------------------------------------
function isSpUrl(url) {
  return url.startsWith(SP_URL);
}

function onNavigate(details) {
  if (details.url && isSpUrl(details.url)) {
    console.log('Recognized SP navigation to: ' + details.url + '.' +
      'Refreshing count...');
    initInterface();
  }
}

// LISTENER
// ------------------------------------
chrome.browserAction.onClicked.addListener((tab) => {
  handleJiraRequest(tab);
});

chrome.runtime.onMessage.addListener(function(request) {
  console.log(request);
  if (request.action === 'interfaceReady') {
    console.log('BE INTERFACE YEAH');
  }
});

// INIT INTERFACE STUFF
// ------------------------------------
const SP_URL = 'http://localhost';

// also init when url was entered later
if (chrome.webNavigation && chrome.webNavigation.onDOMContentLoaded &&
  chrome.webNavigation.onReferenceFragmentUpdated) {
  const filters = {
    url: [{ urlContains: SP_URL.replace(/^https?\:\/\//, '') }]
  };
  chrome.webNavigation.onDOMContentLoaded.addListener(onNavigate, filters);
  chrome.webNavigation.onReferenceFragmentUpdated.addListener(
    onNavigate, filters);
} else {
  chrome.tabs.onUpdated.addListener(function(_, details) {
    onNavigate(details);
  });
}

chrome.tabs.query({
  url: SP_URL + '/*'
}, (tabs) => {
  if (tabs) {
    initInterface(tabs[0].id);
  }
});