'use strict';

const logger = require('./logger'),
  oAuth = require('oauth-1.0a'),
  request = require('request');

const version = require('../package.json').version;

// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
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
      signature_method: 'HMAC-SHA256',
      version: null,
      last_ampersand: false
    });
  }

  requestData(path, method, data) {
    return {
      url: `${this.options.hostname}${path}`,
      method: method,
      data: data || {}
    };
  }

  getOAuthParams(options) {
    const oauth = this.oAuthConfig();
    const req = this.requestData(options.path, options.method, options.data);
    return oauth.authorize(req);
  }

  error(message, response, body, error) {
    if (!error) error = new Error(message);
    error.body = body;
    error.response = {
      body: response.body,
      statusCode: response.statusCode
    };
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
        qs: {},
        headers: {
          'User-Agent': `node-woocommerce/${version}`,
          Accept: 'application/json, *.*'
        },
        timeout: this.options.timeout
      };

      if (data) {
        if (method === 'get') options.qs = data;
        else options.json = data;
      }

      if (this.options.ssl) {
        logger.info('Using basic auth');
        options.auth = {
          user: this.options.consumerKey,
          pass: this.options.secret
        };
        options.qs.consumer_key = this.options.consumerKey;
        options.qs.consumer_secret = this.options.secret;
      } else {
        const oAuthParams = this.getOAuthParams({
          method,
          path: apiPath,
          data: options.qs
        });
        options.qs = oAuthParams;
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
            json = JSON.parse(body.trim());
          } else if (typeof body === 'object') {
            json = body;
          }

          if (json.hasOwnProperty('error') || json.hasOwnProperty('errors')) {
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
