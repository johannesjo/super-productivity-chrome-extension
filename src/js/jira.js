import xhr from 'xhr';

// @see https://confluence.atlassian.com/cloud/api-tokens-938839638.html

//const base = 'https://test-sp-app.atlassian.net/rest/api/2';
const base = 'https://test-sp-app.atlassian.net/rest/api/latest';

function b64EncodeUnicode(str) {
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
    const encoded = b64EncodeUnicode(`${orgRequest.config.userName}:${orgRequest.config.password}`);

    console.log(request.body);

    return new Promise((resolve) => {
      this.xhr({
        uri: `${base}/${request.pathname}`,
        method: 'GET',
        body: request.body,
        headers: {
          'Authorization': `Basic ${encoded}`,
          'Content-Type': 'application/json'
        }
      }, function(err, res, body) {
        console.log(res);

        if (err) {
          resolve({
            error: err,
            requestId: orgRequest.requestId
          });
        } else if (res.statusCode >= 300) {
          resolve({
            error: res.statusCode,
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
      body: Object.assign(optional, {
        jql: orgRequest.arguments[0]
      }),
    });
  }

  addWorklog(orgRequest) {
    const issueId = orgRequest.arguments[0];
    const worklog = orgRequest.arguments[1];

    return this.doRequest(orgRequest, {
      pathname: `issue/${issueId}/worklog`,
      method: 'POST',
      body: worklog,
    });
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

  findIssue(orgRequest) {
    const issueId = orgRequest.arguments[0];

    return this.doRequest(orgRequest, {
      pathname: `issue/${issueId}`,
      method: 'GET',
    });
  }

  transitionIssue() {
  }
}