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

  doRequest(request) {
    return new Promise((resolve, reject) => {
      this.xhr({
        uri: `${base}/${request.pathname}`,
        method: 'GET',
        //body: '',
        headers: {
          'Content-Type': 'application/json'
        }
      }, function(err, res, body) {
        if (err) {
          resolve({
            error: err,
            requestId: request.requestId
          });
        } else if (body) {
          console.log(JSON.parse(body), request, res);
          resolve({
            response: JSON.parse(body),
            requestId: request.requestId
          });
        }
      });
    });
  }

  searchJira(orgRequest) {
    const optional = orgRequest.arguments.length > 1 && orgRequest.arguments[1] !== undefined ? orgRequest.arguments[1] : {};
    return this.doRequest({
      requestId: orgRequest.requestId,
      pathname: '/search',
      method: 'POST',
      followAllRedirects: true,
      body: Object.assign({ optional }, {
        //jql: request.arguments[0]
        jql: 'resolution = Unresolved ORDER BY updatedDate DESC'
      }),
    });
  }

  addWorklog() {
  }

  searchUsers() {
  }

  listTransitions() {
  }

  updateIssue() {
  }

  findIssue() {
  }

  transitionIssue() {
  }
}