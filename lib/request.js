'use strict';

const crypto = require('crypto'),
  OAuth = require('oauth-1.0a'),
  request = require('request'),
  logger = require('./logger');

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
    return new OAuth({
      consumer: {
        key: this.options.consumerKey,
        secret: this.options.secret
      },
      signature_method: 'HMAC-SHA256',
      hash_function: (baseString, key) => {
        return crypto.createHmac('sha256', key)
          .update(baseString)
          .digest('base64');
      },
      last_ampersand: !this.options.legacy
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

  error(message, response, error) {
    if (!error) error = new Error(message);
    error.response = {
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

        if (response === -1 || body === -1) {
          const msg = 'A meaningless error has occurred, returning -1. ' +
            'This could be the result of an incorrect folder setup.';
          const error = this.error(msg, response);
          logger.error(msg);
          reject(error);
          cb(error, body, response);
          return;
        }

        // Handle error codes between 400 & 600
        if (response.statusCode >= 400 && response.statusCode < 600) {
          const msg = `Request failed with code: ${response.statusCode}`;
          const error = this.error(msg, response);

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

          let json = {};
          if (typeof body === 'string' && body.trim() !== '') {
            json = JSON.parse(body.trim());
          } else if (typeof body === 'object') {
            json = body;
          }

          if (json.hasOwnProperty('error') || json.hasOwnProperty('errors')) {
            const errorMessage = json.error || JSON.stringify(json.errors);
            const serverError = this.error(errorMessage, response);
            cb(serverError, body, response);
            reject(serverError);
            return;
          }

          logger.info('Request complete, returning data and response.');
          cb(null, json, response);
          resolve(json);

        } catch (e) {

          const malformedMsg = `Error parsing response body: ${e.message || e}`;
          const malformedError = this.error(malformedMsg, response, e);

          logger.error(malformedMsg);
          cb(malformedError, body, response);
          reject(malformedError);

        }
      });
    });
  }
}

module.exports = Request;
