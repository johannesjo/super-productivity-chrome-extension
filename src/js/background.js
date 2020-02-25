import '../img/icon_32x32.png'
import '../img/icon_128x128.png'
import { IS_DEV } from 'cfg';
import { JiraApiWrapper } from './jira';
import { IdleHandler } from './idle-handler';

let isInterfaceInitialized = false;
const jira = new JiraApiWrapper();
let SP_URL = 'https://app.super-productivity.com';
const QUERY_URLS = [
  SP_URL
];

if (IS_DEV) {
  console.log('SPEX:background IS_DEV=true');
  SP_URL = 'http://localhost';
  QUERY_URLS.push(SP_URL)
}

// init idle handler
new IdleHandler(15, onIdle);

// init once
getSPTabId((id) => {
  if (id) {
    initInterfaceForTab(id);
  }
});

function onIdle(idleTimeInMs) {
  console.log(`SPEX:background:isIdle: for ${idleTimeInMs}`);

  getSPTabId((id) => {
    if (id) {
      chrome.tabs.sendMessage(id, {
        type: 'IDLE',
        idleTimeInMs
      });
    } else {
      throw 'SPEX:background: No super productivity tab id';
    }
  });
}

// MAIN
// ---------------------------------
function handleJiraRequest(request) {
  jira.execRequest(request)
    .then((res) => {
      console.log(`SPEX:background:jira.execRequest:Response:`, res);

      getSPTabId((id) => {
        if (id) {
          chrome.tabs.sendMessage(id, {
            type: 'JIRA_RESPONSE',
            response: res
          });
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
    url: QUERY_URLS.map(url => url + '/*'),
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
    chrome.tabs.create({url: SP_URL});
  }
});

chrome.runtime.onMessage.addListener((request) => {
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

function isSpUrl(urlToCheck) {
  return QUERY_URLS.find(url => urlToCheck.startsWith(url));
}

// also init when url was entered later
// also this logic is required to make sure, it is injected on reloads,
// but not if the route inside sp app changes
let tabMap = {};
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = tab.url;

  if (
    url
    && isSpUrl(url)
    && (changeInfo.status === 'complete')
  ) {
    // only trigger for reloads or in
    if ((!tabMap[tabId] || (tabMap[tabId] === url))) {
      console.log(`SPEX:background: Recognized Dynamic load of SP App url`);
      tabMap[tabId] = url;
      initInterfaceForTab(tabId);
    }
    tabMap[tabId] = url;
  } else if (tabMap[tabId] && (changeInfo.status === 'loading') && !isSpUrl(url)) {
    // remove
    delete tabMap[tabId];
  }
});
