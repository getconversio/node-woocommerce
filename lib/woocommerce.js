'use strict';

var logger = require('./logger'),
  Request = require('./request');

/**
 * Constructor sets the options for the module
 * @param {object} options:
 * url: the store url with no protocol or trailing forward slash,
 * e.g. mystore.com (required)
 * port: the port number to reach your store's API (default: 80)
 * ssl: true/false, is your api on https or http (default: false)
 * consumerKey: the consumer key generated in the WC control panel (required)
 * secret: the secret generated in the WC control panel (required)
 * apiPath: the path of the api (default: /wc-api/v2)
 * logLevel: 0: error only, 1: error & info
 */
var WooCommerce = function(options) {

  this.options = options || {};

  if (!this.options.consumerKey || !this.options.secret) {
    throw new Error('The consumer key and secret are required');
  }

  if (!this.options.url) {
    throw new Error('The URL is required');
  }

  // Set defaults
  this.options.logLevel = this.options.logLevel || 0;
  this.options.ssl = this.options.ssl || false;
  this.options.port = this.options.port || 80;
  this.options.apiPath = this.options.apiPath || '/wc-api/v2';

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

};

WooCommerce.prototype.fullPath = function(path) {
  return this.options.apiPath + path;
};

WooCommerce.prototype.get = function(path, cb) {
  this.request.completeRequest('get', this.fullPath(path), null, cb);
};

WooCommerce.prototype.post = function(path, data, cb) {
  this.request.completeRequest('post', this.fullPath(path), data, cb);
};

WooCommerce.prototype.delete = function(path, cb) {
  this.request.completeRequest('delete', this.fullPath(path), null, cb);
};

WooCommerce.prototype.put = function(path, data, cb) {
  this.request.completeRequest('put', this.fullPath(path), data, cb);
};

module.exports = WooCommerce;
