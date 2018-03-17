import xhr from 'xhr';

const base = 'https://test-sp-app.atlassian.net/rest/api/2';

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
    return new Promise((resolve) => {
      this.xhr({
        uri: `${base}/${request.pathname}`,
        method: 'GET',
        body: request.body,
        headers: {
          'Content-Type': 'application/json'
        }
      }, function(err, res, body) {
        if (err) {
          resolve({
            error: err,
            requestId: orgRequest.requestId
          });
        } else if (body) {
          //console.log(JSON.parse(body), request, res);
          resolve({
            response: JSON.parse(body),
            requestId: orgRequest.requestId
          });
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
      pathname: `/issue/${issueId}`,
      method: 'PUT',
      body: issueUpdate,
    });
  }

  findIssue() {
  }

  transitionIssue() {
  }
}