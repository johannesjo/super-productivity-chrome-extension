function initInterface() {
  return 'INTERFACE YEAH FE'
}

chrome.runtime.sendMessage({
  action: 'initInterface',
  source: initInterface()
});

