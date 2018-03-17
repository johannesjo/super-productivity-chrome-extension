import xhr from 'xhr';

const base = 'https://test-sp-app.atlassian.net/rest/api/2';

function b64EncodeUnicode(str) {
  // first we use encodeURIComponent to get percent-encoded UTF-8,
  // then we convert the percent encodings into raw bytes which
  // can be fed into btoa.
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    function toSolidBytes(match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
}

export class JiraApiWrapper {
  constructor() {
    this.xhr = xhr;
  }

  execRequest(request) {
    if (request.apiMethod) {
      return this[request.apiMethod](request);
    }
  }

  doRequest(orgRequest, request) {
    console.log(request);

    return new Promise((resolve) => {
      this.xhr({
        uri: `${base}/${request.pathname}`,
        method: 'GET',
        body: request.body,
        headers: {
          'Authentication': b64EncodeUnicode(`${orgRequest.config.userName}:${orgRequest.config.password}`),
          'Content-Type': 'application/json'
        }
      }, function(err, res, body) {
        if (err) {
          resolve({
            error: err,
            requestId: orgRequest.requestId
          });
        } else if (body) {
          const parsed = JSON.parse(body);
          const err = parsed.errorMessages || parsed.errors;
          if (err) {
            resolve({
              error: err,
              requestId: orgRequest.requestId
            });
          } else {
            resolve({
              response: parsed,
              requestId: orgRequest.requestId
            });
          }
        }
      });
    });
  }

  searchJira(orgRequest) {
    const optional = orgRequest.arguments.length > 1 && orgRequest.arguments[1] !== undefined ? orgRequest.arguments[1] : {};
    return this.doRequest(orgRequest, {
      pathname: '/search',
      method: 'POST',
      body: Object.assign({ optional }, {
        jql: orgRequest.arguments[0]
      }),
    });
  }

  addWorklog() {
  }

  searchUsers() {
  }

  listTransitions() {
  }

  updateIssue(orgRequest) {
    const issueId = orgRequest.arguments[0];
    const issueUpdate = orgRequest.arguments[1];

    return this.doRequest(orgRequest, {
      pathname: `issue/${issueId}`,
      method: 'PUT',
      body: issueUpdate,
    });
  }

  findIssue() {
  }

  transitionIssue() {
  }
}