'use strict';

const logger = require('./logger'),
  Request = require('./request');

/**
 * Constructor sets the options for the module
 * @param {object} options:
 * url: the store url with no protocol or trailing forward slash,
 * e.g. mystore.com (required)
 * ssl: true/false, is your api on https or http (default: false)
 * consumerKey: the consumer key generated in the WC control panel (required)
 * secret: the secret generated in the WC control panel (required)
 * apiPath: the path of the api (default: /wc-api/v2)
 * logLevel: 0: error only, 1: error & info
 */

class WooCommerce {
  constructor(options) {
    this.options = options || {};

    if (!this.options.consumerKey || !this.options.secret) {
      throw new Error('The consumer key and secret are required');
    }

    if (!this.options.url) {
      throw new Error('The URL is required');
    }

    // Set defaults
    this.options.logLevel = this.options.logLevel || 0;
    this.options.apiPath = this.options.apiPath || '/wc-api/v2';

    // Automatically set ssl when not set
    if (typeof options.ssl === 'undefined') {
      const https = /https/.test(this.options.hostname);
      this.options.ssl = https ? true : false;
    }

    logger.logLevel = this.options.logLevel;

    // Set request object
    this.request = new Request({
      hostname: this.options.url,
      ssl: this.options.ssl,
      port: this.options.port,
      consumerKey: this.options.consumerKey,
      secret: this.options.secret,
      logLevel: this.options.logLevel
    });

    logger.info(require('util').inspect(this.options));
  }

  fullPath(path) {
    return this.options.apiPath + path;
  }

  get(path, cb) {
    return this.request.complete('get', this.fullPath(path), null, cb);
  }

  post(path, data, cb) {
    return this.request.complete('post', this.fullPath(path), data, cb);
  }

  delete(path, cb) {
    return this.request.complete('delete', this.fullPath(path), null, cb);
  }

  put(path, data, cb) {
    return this.request.complete('put', this.fullPath(path), data, cb);
  }
}


module.exports = WooCommerce;
