'use strict';

var WooCommerce = require('../lib/woocommerce'),
  logger = require('../lib/logger'),
  Request = require('../lib/request'),
  should = require('chai').should(),
  nock = require('nock'),
  sinon = require('sinon');


describe('Constructor: #WooCommerce', () => {

  it('Should throw an error if the consumerKey or secret are missing', () => {
      should.Throw(() => {
        new WooCommerce();
      }, Error);
    });

  it('Should throw an error if the url is missing', () => {
    should.Throw(() => {
      new WooCommerce({
        consumerKey: 'foo',
        secret: 'foo'
      });
    }, Error);
  });

  it('Should set the correct default when requirements are met', () => {
    var wc = new WooCommerce({
      url: 'foo.com',
      consumerKey: 'foo',
      secret: 'foo'
    });

    wc.options.logLevel.should.equal(0);
    wc.options.ssl.should.be.false;
    wc.options.apiPath.should.equal('/wc-api/v2');
  });

  it('Should set the correct ssl default for https', () => {
    var wc = new WooCommerce({
      url: 'https://foo.com',
      consumerKey: 'foo',
      secret: 'foo'
    });

    wc.options.ssl.should.be.true;
  });

  it('Should set the correct ssl default for http', () => {
    var wc = new WooCommerce({
      url: 'http://foo.com',
      consumerKey: 'foo',
      secret: 'foo'
    });

    wc.options.ssl.should.be.false;
  });

});

describe('Helper Methods: #WooCommerce', () => {

  var wc = new WooCommerce({
    url: 'foo.com',
    consumerKey: 'foo',
    secret: 'foo'
  });

  describe('Get', () => {
    it('Should call the request', done => {
      var requestMock = sinon.mock(Request.prototype);
      var expectation = requestMock
        .expects('complete')
        .once()
        .yields();

      wc.get('/foo', () => {
        expectation.verify();
        requestMock.restore();
        done();
      });
    });
  });

  describe('Post', () => {
    it('Should call the request', done => {
      var requestMock = sinon.mock(Request.prototype);
      var expectation = requestMock
        .expects('complete')
        .once()
        .yields();

      wc.post('/foo', {}, () => {
        expectation.verify();
        requestMock.restore();
        done();
      });
    });
  });

  describe('Put', () => {
    it('Should call the request', done => {
      var requestMock = sinon.mock(Request.prototype);
      var expectation = requestMock
        .expects('complete')
        .once()
        .yields();

      wc.put('/foo', {}, () => {
        expectation.verify();
        requestMock.restore();
        done();
      });
    });
  });

  describe('Delete', () => {
    it('Should call the request', done => {
      var requestMock = sinon.mock(Request.prototype);
      var expectation = requestMock
        .expects('complete')
        .once()
        .yields();

      wc.delete('/foo', () => {
        expectation.verify();
        requestMock.restore();
        done();
      });
    });
  });

});

describe('Logger: #WooCommerce', () => {
  it('Should be set to a log level of zero by default', () => {
    logger.logLevel.should.equal(0);
  });

  it('Should log an error at any log level', () => {
    var spy = sinon.spy(console, 'log');
    logger.error('Logging test error at 0');
    logger.level = 1;
    logger.error('Logging test error at 1');
    spy.calledTwice.should.be.true;
    spy.restore();
  });

  it('Should log info at level one', () => {
    var spy = sinon.spy(console, 'log');
    logger.logLevel = 1;
    logger.info('Logging test error at 1');
    spy.calledOnce.should.be.true;
    spy.restore();
  });

  it('Should not log info at level zero', () => {
    const spy = sinon.spy(console, 'log');
    logger.logLevel = 0;
    logger.info('Logging test error at 1');
    spy.callCount.should.equal(0);
    spy.restore();
  });
});

describe('Request: #WooCommerce', () => {

  beforeEach(() => {
    nock.cleanAll();
  });

  const rOAuth = new Request({
    hostname: 'http://foo.com',
    consumerKey: 'foo',
    secret: 'foo',
    headers: {
      test: 'header'
    }
  });

  const rBasic = new Request({
    hostname: 'https://foo.com',
    ssl: true,
    port: 443,
    consumerKey: 'foo',
    secret: 'foo',
    headers: {
      test: 'header'
    }
  });

  it('Should return an error if hostname is missing', () => {
    should.Throw(() => {
      new Request();
    }, Error);
  });

  it('Should return an error on bad request', done => {
    const api = nock('http://foo.com')
      .filteringPath(/\?.*/g, '?xxx')
      .post('/orders?xxx', {})
      .reply(400, { success: true });

    rOAuth.complete('post', '/orders', {}, err => {
      err.should.not.be.null;
      api.done();
      done();
    });
  });

  it('Should return an error on internal server error', done => {
    const api = nock('http://foo.com')
      .filteringPath(/\?.*/g, '?xxx')
      .post('/orders?xxx', {})
      .reply(500, { success: true });

    rOAuth.complete('post', '/orders', {}, err => {
      err.should.not.be.null;
      api.done();
      done();
    });
  });

  it('Should return an error the request JSON is malformed', done => {
    const api = nock('http://foo.com')
      .defaultReplyHeaders({
        'content-type': 'application/json'
      })
      .filteringPath(/\?.*/g, '?xxx')
      .post('/orders?xxx', {})
      .reply(200, '<malformed>');

    rOAuth.complete('post', '/orders', {}, err => {
      err.should.not.be.null;
      err.message.should.equal('Unexpected token <');
      api.done();
      done();
    });
  });

  it('Should return content for http using OAuth', done => {
    const api = nock('http://foo.com')
      .filteringPath(/\?.*/g, '?xxx')
      .post('/orders?xxx', {})
      .reply(200, '{ "success": true }');

    rOAuth.complete('post', '/orders', {}, (err, data) => {
      should.not.exist(err);
      data.should.be.a.string;
      api.done();
      done();
    });
  });

  it('Should support data for GET requests', done => {
    const api = nock('https://foo.com/')
      .get('/orders')
      .query({
        consumer_key: 'foo',
        consumer_secret: 'foo',
        filter: {
          limit: 10
        }
      })
      .reply(200, '{ "success": true }');

    rBasic.complete('get', '/orders', { 'filter[limit]': 10 }, (err, data) => {
      should.not.exist(err);
      data.should.be.a.string;
      api.done();
      done();
    });
  });

  it('Should return content for https using Basic Auth', done => {
    const api = nock('https://foo.com/')
      .post('/orders')
      .query(true)
      .reply(200, '{ "success": true }');

    rBasic.complete('post', '/orders', {}, (err, data) => {
      should.not.exist(err);
      data.should.be.a.string;
      api.done();
      done();
    });
  });

  it('Should return content for when not a json', done => {
    const api = nock('http://foo.com')
      .defaultReplyHeaders({
        'content-type': 'application/xml'
      })
      .filteringPath(/\?.*/g, '?xxx')
      .post('/orders?xxx', {})
      .reply(200, '<xml></xml>');

    rOAuth.complete('post', '/orders', {}, (err, data) => {
      api.done();
      should.not.exist(err);
      data.should.be.a.string;
      api.done();
      done();
    });
  });

  it('Should return an error if "errors" are found in the response JSON', done => {
    const api = nock('https://foo.com')
      .filteringPath(/\?.*/g, '?xxx')
      .get('/errors?xxx')
      .reply(200, '{ "errors": ["An error has occurred."] }', {
        'content-type': 'application/json'
      });

    rBasic.complete('get', '/errors', {}, err => {
      api.done();
      err.should.not.be.null;
      err.message.should.equal('["An error has occurred."]');
      done();
    });
  });

});
