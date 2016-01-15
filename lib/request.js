'use strict';
/**
 * To make the requests asynchronously
 */

const logger = require('./logger'),
  querystring = require('querystring'),
  oAuth = require('oauth-1.0a'),
  request = require('request');

class Request {

  constructor(options) {
    this.options = options || {};
    if (!this.options.hostname) {
      throw new Error('hostname is a required option');
    }
  }

  oAuthConfig() {
    return oAuth({
      consumer: {
        public: this.options.consumerKey,
        secret: this.options.secret
      },
      'signature_method': 'HMAC-SHA256',
      version: null,
      'last_ampersand': false
    });
  }

  requestData(path, method) {
    return {
      url: `${this.options.hostname}${path}`,
      method: method,
      data: {}
    };
  }

  formatQuery(authorize) {
    let query = '?';
    for (let key in authorize) {
      const val = key === 'oauth_signature' ?
        querystring.escape(authorize[key]) : authorize[key];
      query += key + '=' + val + '&';
    }
    return query.substr(0, query.length - 1);
  }

  getOAuthParams(options) {
    const oauth = this.oAuthConfig();
    const req = this.requestData(options.path, options.method);
    const authorize = oauth.authorize(req);
    return this.formatQuery(authorize);
  }

  error(message, response, body, error) {
    if (!error) error = new Error(message);
    error.body = body;
    error.response = response;
    return error;
  }

  complete(method, apiPath, data, cb) {
    if (!cb) cb = () => {};
    const fullPath = this.options.hostname + apiPath;

    logger.info(`Requesting: ${fullPath} with method: ${method}`);

    return new Promise((resolve, reject) => {
      const options = {
        method,
        url: fullPath,
        headers: {
          'User-Agent': 'node-woocommerce/2.0.0',
          'Accept': 'application/json, *.*'
        }
      };

      if (data) options.json = data;
      if (this.options.ssl) {
        logger.info('Using basic auth');
        options.auth = {
          user: this.options.consumerKey,
          pass: this.options.secret
        };
        options.url += `?consumer_key=${this.options.consumerKey}` +
          `&consumer_secret=${this.options.secret}`;
      } else {
        const oAuthParams = this.getOAuthParams({ path: apiPath, method });
        options.url += oAuthParams;
      }

      request(options, (err, response, body) => {
        if (err) {
          reject(err);
          logger.error(err);
          cb(err);
          return;
        }

        // Handle error codes between 400 & 600
        if (response.statusCode >= 400 && response.statusCode < 600) {
          const msg = `Request failed with code: ${response.statusCode}`;
          const error = this.error(msg, response, body);

          logger.error(msg);
          reject(error);
          cb(error, body, response);
          return;
        }

        try {

          const pattern = new RegExp('application/json');
          if (!pattern.test(response.headers['content-type'])) {
            cb(null, body, response);
            resolve(body);
            return;
          }

          var json = {};
          if (typeof body === 'string' && body.trim() !== '') {
            json = JSON.parse(body);
          } else if (typeof body === 'object') {
            json = body;
          }

          if (json.hasOwnProperty('error') ||
            json.hasOwnProperty('errors')) {
              const errorMessage = json.error || JSON.stringify(json.errors);
              const serverError = this.error(errorMessage, response, body);
              cb(serverError, body, response);
              reject(serverError);
              return;
          }

          logger.info('Request complete, returning data and response.');
          cb(null, json, response);
          resolve(json);

        } catch (e) {

          const malformedMsg = `Error parsing response body: ${e.message || e}`;
          const malformedError = this.error(malformedMsg, body, response, e);

          logger.error(malformedMsg);
          cb(malformedError, body, response);
          reject(malformedError);

        }
      });

    });
  }

}

module.exports = Request;
