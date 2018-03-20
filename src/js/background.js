import '../img/icon_32x32.png'
import '../img/icon_128x128.png'
import { IS_DEV } from 'cfg';
import { JiraApiWrapper } from './jira';

let isInterfaceInitialized = false;
const jira = new JiraApiWrapper();

let SP_URL = 'https://super-productivity.com/app';

if (IS_DEV) {
  console.log('SPEX:background IS_DEV=true');
  SP_URL = 'http://localhost';
}

// init once
getSPTabId((id) => {
  initInterfaceForTab(id);
});

// MAIN
// ---------------------------------
function handleJiraRequest(request) {
  jira.execRequest(request)
    .then((res) => {
      console.log(`SPEX:background:jira.execRequest:${request.apiMethod}:Response:`, res);

      getSPTabId((id) => {
        if (id) {
          chrome.tabs.sendMessage(id, res);
        } else {
          throw 'SPEX:background: No super productivity tab id';
        }
      });
    });
}

function initInterfaceForTab(passedTabId) {
  chrome.tabs.executeScript(passedTabId, {
    file: 'frontendInterface.bundle.js',
    allFrames: true,
    runAt: 'document_idle'
  }, () => {

    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    }
  });
}

// HELPER
// ------------------------------------

// NOTE: we need all this logic instead of using the manifest to prevent
// jira pre-flight issue
function getSPTabId(cb) {
  let _tabId = false;
  chrome.tabs.query({
    url: [
      SP_URL + '/*',
    ],
  }, (tabs) => {
    if (tabs && tabs[0]) {
      _tabId = tabs[0].id;
    }

    if (tabs && tabs.length > 1) {
      console.warn('SPEX:background: Multiple tabs with App found');
    }
    cb(_tabId);
  });
}

// LISTENER
// ------------------------------------
chrome.browserAction.onClicked.addListener((tab) => {
  console.log('CLICK', tab);
  if (!isInterfaceInitialized) {
    chrome.tabs.create({ url: SP_URL });
  }
});

chrome.runtime.onMessage.addListener(function(request) {
  getSPTabId((id) => {
    if (!id) {
      throw 'No super productivity tab id';
    } else {
      switch (request.action) {
        case 'JIRA_REQUEST':
          handleJiraRequest(request.source);
          break;
      }
    }
  });
});

// HANDLE NAVIGATING TO SP AND RELOADING
// --------------------------------------
function onNavigate(details) {
  if (details.url && isSpUrl(details.url)) {
    console.log('SPEX:background: Recognized SP navigation to: ' + details.url + '.' + 'Refreshing count...');
    getSPTabId((id) => {
      initInterfaceForTab(id);
    });
  }
}

function isSpUrl(url) {
  return url.startsWith(SP_URL);
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (isSpUrl(tab.url)) {
    initInterfaceForTab(tabId);
  }
});

// also init when url was entered later
if (chrome.webNavigation && chrome.webNavigation.onDOMContentLoaded &&
  chrome.webNavigation.onReferenceFragmentUpdated) {
  const filters = {
    url: [{ urlContains: SP_URL.replace(/^https?\:\/\//, '') }]
  };
  chrome.webNavigation.onDOMContentLoaded.addListener(onNavigate, filters);
} else {
  chrome.tabs.onUpdated.addListener(function(_, details) {
    onNavigate(details);
  });
}
