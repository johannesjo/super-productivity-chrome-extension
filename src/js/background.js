import '../img/icon_32x32.png'
import '../img/icon_128x128.png'
import { JiraApiWrapper } from './jira';

let isInterfaceInitialized = false;
const jira = new JiraApiWrapper();

// const SP_URL = 'http://localhost';
const SP_URL = 'https://super-productivity.com/app';

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
          throw 'No super productivity tab id';
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
function isSpUrl(url) {
  return url.startsWith(SP_URL);
}

function getSPTabId(cb) {
  let _tabId = false;
  chrome.tabs.query({
    url: SP_URL + '/*'
  }, (tabs) => {
    if (tabs && tabs[0]) {
      _tabId = tabs[0].id;
    }
    cb(_tabId);
  });
}

function onNavigate(details) {
  if (details.url && isSpUrl(details.url)) {
    // console.log('Recognized SP navigation to: ' + details.url + '.' + 'Refreshing count...');
    //getSPTabId((id) => {
    //  initInterface(id);
    //});
  }
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

// INIT INTERFACE STUFF
// ------------------------------------

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
