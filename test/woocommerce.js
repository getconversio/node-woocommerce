var WooCommerce = require('../lib/woocommerce'),
  logger = require('../lib/logger'),
  Request = require('../lib/request'),
  should = require('chai').should(),
  nock = require('nock'),
  sinon = require('sinon');


describe('Constructor: #WooCommerce', function() {

  it('Should throw an error if the ' +
    'consumerKey or secret are missing', function() {
      should.Throw(function() {
        new WooCommerce();
      }, Error);
    });

  it('Should throw an error if the url is missing', function() {
    should.Throw(function() {
      new WooCommerce({
        consumerKey: 'foo',
        secret: 'foo'
      });
    }, Error);
  });

  it('Should set the correct default when requirements are met', function() {
    var wc = new WooCommerce({
      url: 'foo.com',
      consumerKey: 'foo',
      secret: 'foo'
    });

    wc.options.logLevel.should.equal(0);
    wc.options.ssl.should.be.false;
    wc.options.port.should.equal(80);
    wc.options.apiPath.should.equal('/wc-api/v2');
  });

});

describe('Helper Methods: #WooCommerce', function() {

  var wc = new WooCommerce({
    url: 'foo.com',
    consumerKey: 'foo',
    secret: 'foo'
  });

  describe('Get', function() {
    it('Should call the request', function(done) {
      var requestMock = sinon.mock(Request.prototype);
      var expectation = requestMock
        .expects('completeRequest')
        .once()
        .yields();

      wc.get('/foo', function() {
        expectation.verify();
        requestMock.restore();
        done();
      });
    });
  });

  describe('Post', function(done) {
    it('Should call the request', function(done) {
      var requestMock = sinon.mock(Request.prototype);
      var expectation = requestMock
        .expects('completeRequest')
        .once()
        .yields();

      wc.post('/foo', {}, function() {
        expectation.verify();
        requestMock.restore();
        done();
      });
    });
  });

  describe('Put', function(done) {
    it('Should call the request', function(done) {
      var requestMock = sinon.mock(Request.prototype);
      var expectation = requestMock
        .expects('completeRequest')
        .once()
        .yields();

      wc.put('/foo', {}, function() {
        expectation.verify();
        requestMock.restore();
        done();
      });
    });
  });

  describe('Delete', function(done) {
    it('Should call the request', function(done) {
      var requestMock = sinon.mock(Request.prototype);
      var expectation = requestMock
        .expects('completeRequest')
        .once()
        .yields();

      wc.delete('/foo', function() {
        expectation.verify();
        requestMock.restore();
        done();
      });
    });
  });

});

describe('Logger: #WooCommerce', function() {
  it('Should be set to a log level of zero by default', function(){
    logger.level.should.equal(0);
  });

  it('Should log an error at any log level', function(){
    var spy = sinon.spy(console, 'log');
    logger.error('Logging test error at 0');
    logger.level = 1;
    logger.error('Logging test error at 1');
    spy.calledTwice.should.be.true;
    spy.restore();
  });

  it('Should log info at level one', function(){
    var spy = sinon.spy(console, 'log');
    logger.level = 1;
    logger.info('Logging test error at 1');
    spy.calledOnce.should.be.true;
    spy.restore();
  });

  it('Should not log info at level zero', function(){
    var spy = sinon.spy(console, 'log');
    logger.level = 0;
    logger.info('Logging test error at 1');
    spy.callCount.should.equal(0);
    spy.restore();
  });
});

describe('Request: #WooCommerce', function() {

  afterEach(function(){
    nock.cleanAll();
  });

  it('Should return an error if hostname is missing', function(){
    should.Throw(function(){
      new Request();
    }, Error);
  });

  it('Should return an error on bad request', function(done) {
    var api = nock('http://foo1.com')
      .filteringPath(/\?.*/g, '?xxx')
      .post('/orders?xxx', {})
      .reply(400, {});

    var rOAuth = new Request({
      hostname: 'foo1.com',
      consumerKey: 'foo',
      secret: 'foo',
      headers: {
        test: 'header'
      }
    });

    rOAuth.completeRequest('post', '/orders', {}, function(err, data, res){
      err.should.not.be.null;
      done();
    });
  });

  it('Should return an error on internal server error', function(done) {
    var api = nock('http://foo2.com')
      .filteringPath(/\?.*/g, '?xxx')
      .post('/orders?xxx', {})
      .reply(500, {});

    var rOAuth = new Request({
      hostname: 'foo2.com',
      consumerKey: 'foo',
      secret: 'foo',
      headers: {
        test: 'header'
      }
    });

    rOAuth.completeRequest('post', '/orders', {}, function(err, data, res){
      err.should.not.be.null;
      done();
    });
  });

  it('Should return an error the request JSON is malformed', function(done){
    var api = nock('http://foo3.com')
      .defaultReplyHeaders({
        'content-type': 'application/json'
      })
      .filteringPath(/\?.*/g, '?xxx')
      .post('/orders?xxx', {})
      .reply(200, '<malformed>');

    var rOAuth = new Request({
      hostname: 'foo3.com',
      consumerKey: 'foo',
      secret: 'foo',
      headers: {
        test: 'header'
      }
    });

    rOAuth.completeRequest('post', '/orders', {}, function(err, data, res){
      err.should.not.be.null;
      err.message.should.equal('Unexpected token <');
      done();
    });
  });

  it('Should return content for http using OAuth', function(done) {
    var api = nock('http://foo4.com')
      .filteringPath(/\?.*/g, '?xxx')
      .post('/orders?xxx', {})
      .reply(200, {});

    var rOAuth = new Request({
      hostname: 'foo4.com',
      consumerKey: 'foo',
      secret: 'foo',
      headers: {
        test: 'header'
      }
    });

    rOAuth.completeRequest('post', '/orders', {}, function(err, data, res){
      should.not.exist(err);
      data.should.be.a.string;
      done();
    });
  });

  it('Should return content for https using Basic Auth', function(done) {
    var api = nock('https://foo5.com')
      .post('/orders', {})
      .reply(200, {});

    var rBasic = new Request({
      hostname: 'foo5.com',
      ssl: true,
      port: 80,
      consumerKey: 'foo',
      secret: 'foo',
      headers: {
        test: 'header'
      }
    });

    rBasic.completeRequest('post', '/orders', {}, function(err, data, res){
      should.not.exist(err);
      data.should.be.a.string;
      done();
    });
  });

  it('Should return content for when not a json', function(done) {
    var api = nock('http://foo6.com')
      .defaultReplyHeaders({
        'content-type': 'text/plain'
      })
      .filteringPath(/\?.*/g, '?xxx')
      .post('/orders?xxx', {})
      .reply(200, 'plain');

    var rOAuth = new Request({
      hostname: 'foo4.com',
      consumerKey: 'foo',
      secret: 'foo',
      headers: {
        test: 'header'
      }
    });

    rOAuth.completeRequest('post', '/orders', {}, function(err, data, res){
      should.not.exist(err);
      data.should.equal('plain');
      done();
    });
  });

  it('Should return an error if "errors" are found in the response JSON', function(done){
    var api = nock('https://foo7.com')
      .filteringPath(/\?.*/g, '?xxx')
      .post('/orders?xxx', {})
      .reply(200, {errors: ['An error has occurred.']});

    var rOAuth = new Request({
      hostname: 'foo4.com',
      consumerKey: 'foo',
      secret: 'foo',
      headers: {
        test: 'header'
      }
    });

    rOAuth.completeRequest('post', '/orders', {}, function(err, data, res){
      err.should.not.be.null;
      err.message.should.equal('["An error has occurred."]');
      done();
    });
  });

});
