const action = 'search';
const base = 'https://test-sp-app.atlassian.net/rest/api/2';

function handleRequest(tab) {
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

chrome.browserAction.onClicked.addListener((tab) => {
  handleRequest(tab);
});

chrome.runtime.onMessage.addListener(function(request) {
  if (request.action === 'initInterface') {
    console.log('BE INTERFACE YEAH');
  }
});

const SP_URL = 'http://localhost';

function isSpUrl(url) {
  return url.startsWith(SP_URL);
}

const filters = {
  url: [{ urlContains: SP_URL.replace(/^https?\:\/\//, '') }]
};

function onNavigate(details) {
  if (details.url && isSpUrl(details.url)) {
    console.log('Recognized SP navigation to: ' + details.url + '.' +
      'Refreshing count...');
    startRequest({ scheduleRequest: false, showLoadingAnimation: false });
  }
}

if (chrome.webNavigation && chrome.webNavigation.onDOMContentLoaded &&
  chrome.webNavigation.onReferenceFragmentUpdated) {
  chrome.webNavigation.onDOMContentLoaded.addListener(onNavigate, filters);
  chrome.webNavigation.onReferenceFragmentUpdated.addListener(
    onNavigate, filters);
} else {
  chrome.tabs.onUpdated.addListener(function(_, details) {
    onNavigate(details);
  });
}

initInterface();

function initInterface() {
  chrome.tabs.executeScript(null, {
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