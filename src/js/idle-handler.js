export class IdleHandler {
  constructor(detectionIntervalInSeconds, onIdle) {
    let idleTimeInMs = 0;

    setInterval(() => {
      chrome.idle.queryState(detectionIntervalInSeconds, (idleState) => {
        console.log('SPEX:idleState', idleState);
        if (idleState !== 'active') {
          idleTimeInMs += detectionIntervalInSeconds * 1000;
          onIdle(idleTimeInMs);
        } else {
          idleTimeInMs = 0;
        }
      });
    }, detectionIntervalInSeconds * 1000);
  }
}