import '../img/icon_32x32.png'
import '../img/icon_128x128.png'
import { IS_DEV } from 'cfg';
import { JiraApiWrapper } from './jira';

let isInterfaceInitialized = false;
const jira = new JiraApiWrapper();

const SP_DEV_URL = 'http://localhost';
const SP_URL = 'https://super-productivity.com/app';

let injectUrls;
if (IS_DEV) {
  console.log('SPEX:background IS_DEV=true');
  injectUrls = [
    SP_DEV_URL + '/*',
  ]
} else {
  injectUrls = [
    SP_URL + '/*',
  ]
}

// init once
getSPTabId((id) => {
  initInterface(id);
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

let saveTabId;

function initInterface(passedTabId) {
  // do nothing if initialized here previously
  if (passedTabId) {
    if (passedTabId === saveTabId) {
      console.log('Not initializing because we did so before');
    } else {
      isInterfaceInitialized = true;
      saveTabId = passedTabId;
      chrome.tabs.executeScript(saveTabId, {
        file: 'frontendInterface.bundle.js',
        allFrames: true,
        runAt: 'document_idle'
      }, () => {
        // If you try and inject into an extensions page or the webstore/NTP you'll get an error
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        }
      });
    }
  }
}

// HELPER
// ------------------------------------

// NOTE: we need all this logic instead of using the manifest to prevent
// jira pre-flight issue
function getSPTabId(cb) {
  let _tabId = false;
  chrome.tabs.query({
    url: injectUrls,
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
