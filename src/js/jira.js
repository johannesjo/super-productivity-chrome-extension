import xhr from 'xhr';
import queryStringParser from 'query-string';

export class JiraApiWrapper {
  constructor() {
    this.xhr = xhr;
    this.queryStringParser = queryStringParser.stringify;
  }

  isConfigSufficient(config) {
    if (!config) {
      throw 'SPEX:JiraApiWrapper: No request config.';
    } else if (!config.isJiraEnabled) {
      throw 'SPEX:JiraApiWrapper: Jira not enabled.';
    } else if (!config.host) {
      throw 'SPEX:JiraApiWrapper: Host not configured.';
    } else {
      return true;
    }
  }

  execRequest(request) {
    console.log(`SPEX:JiraApiWrapper:Request:`, request);

    // NEW APPROACH
    if (request && request.requestId && request.requestInit) {
      return this._newApproach(request);
    }

    if (!this.isConfigSufficient(request.config)) {
      return;
    }

    if (request.apiMethod && this[request.apiMethod]) {
      return this[request.apiMethod](request);
    } else {
      throw new Error('SPEX:JiraApiWrapper: invalid request ' + request.apiMethod);
    }
  }


  _newApproach({requestId, requestInit, url}) {
    return fetch(url, requestInit)
      .then((response) => {
        console.log(response);

        // console.log('JIRA_RAW_RESPONSE', response);
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response;
      })
      .then(res => res.json())
      .then(res => ({
        response: res,
        requestId
      }));
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
    const base = `${orgRequest.config.host}/rest/api/latest`;
    // cleanup just in case
    const uri = `${base}/${request.pathname}${queryStr}`.trim().replace('//', '/');

    return new Promise((resolve) => {

      this.xhr({
        uri: uri,
        method: request.method || 'GET',
        body: JSON.stringify(request.body),
        headers: {
          'authorization': `Basic ${encoded}`,
          'Content-Type': 'application/json'
        }
      }, function (err, res, body) {
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
      pathname: 'search',
      method: 'POST',
      body: Object.assign(optional, {
        jql: orgRequest.arguments[0]
      }),
    });
  }

  issuePicker(orgRequest) {
    const jql = orgRequest.arguments.length > 1 && orgRequest.arguments[1] !== undefined ? orgRequest.arguments[1] : '';

    return this.doRequest(orgRequest, {
      pathname: 'issue/picker',
      method: 'GET',
      followAllRedirects: true,
      query: {
        showSubTasks: true,
        showSubTaskParent: true,
        query: orgRequest.arguments[0],
        currentJQL: jql
      },
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
    const username = orgRequest.arguments[0].username;
    const startAt = orgRequest.arguments[0].startAt;
    const maxResults = orgRequest.arguments[0].maxResults;
    const includeActive = orgRequest.arguments[0].includeActive;
    const includeInactive = orgRequest.arguments[0].includeInactive;

    return this.doRequest(orgRequest, {
      pathname: 'user/search',
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
    const expandParam = orgRequest.arguments[1];

    return this.doRequest(orgRequest, {
      pathname: `issue/${issueId}`,
      method: 'GET',
      query: {
        expand: expandParam || ''
      }
    });
  }

  transitionIssue(orgRequest) {
    const issueId = orgRequest.arguments[0];
    const issueTransition = orgRequest.arguments[1];

    return this.doRequest(orgRequest, {
      pathname: `issue/${issueId}/transitions`,
      method: 'POST',
      body: issueTransition
    });
  }

  listStatus(orgRequest) {
    return this.doRequest(orgRequest, {
      pathname: `status`,
      method: 'GET',
    });
  }

  listFields(orgRequest) {
    return this.doRequest(orgRequest, {
      pathname: 'field',
      method: 'GET',
    });
  }

  getCurrentUser(orgRequest) {
    return this.doRequest(orgRequest, {
      pathname: `myself`,
      method: 'GET',
    });
  }
}
