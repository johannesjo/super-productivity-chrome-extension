import xhr from 'xhr';
import queryStringParser from 'query-string';

const base = 'https://test-sp-app.atlassian.net/rest/api/latest';

export class JiraApiWrapper {
  constructor() {
    this.xhr = xhr;
    this.queryStringParser = queryStringParser.stringify;
  }

  execRequest(request) {
    console.log(request.apiMethod);

    if (request.apiMethod) {
      return this[request.apiMethod](request);
    }
  }

  _b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
  }

  doRequest(orgRequest, request) {
    const encoded = this._b64EncodeUnicode(`${orgRequest.config.userName}:${orgRequest.config.password}`);
    const queryStr = request.query ? `?${this.queryStringParser(request.query)}` : '';

    return new Promise((resolve) => {

      this.xhr({
        uri: `${base}/${request.pathname}${queryStr}`,
        method: request.method || 'GET',
        body: JSON.stringify(request.body),
        headers: {
          'authorization': `Basic ${encoded}`,
          'Content-Type': 'application/json'
        }
      }, function(err, res, body) {
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
        } else if (!body) {
          resolve({
            response: null,
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

  searchUsers(orgRequest) {
    const username = arguments[0].username;
    const startAt = arguments[0].startAt;
    const maxResults = arguments[0].maxResults;
    const includeActive = arguments[0].includeActive;
    const includeInactive = arguments[0].includeInactive;

    return this.doRequest(orgRequest, {
      pathname: '/user/search',
      method: 'GET',
      query: {
        username: username,
        startAt: startAt || 0,
        maxResults: maxResults || 50,
        includeActive: includeActive || true,
        includeInactive: includeInactive || false
      }
    });
  }

  listTransitions(orgRequest) {
    const issueId = orgRequest.arguments[0];

    return this.doRequest(orgRequest, {
      pathname: `issue/${issueId}/transitions`,
      method: 'GET',
      query: {
        expand: 'transitions.fields'
      }
    });
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

  transitionIssue(orgRequest) {
  }
}