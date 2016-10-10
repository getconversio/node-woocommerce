'use strict';

const Request = require('../lib/request'),
  chai = require('chai'),
  nock = require('nock');

const should = chai.should();

describe('Request', () => {
  beforeEach(() => nock.cleanAll());

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
    should.throw(() => {
      new Request();
    }, Error);
  });

  it('Should return an error on bad request', done => {
    const api = nock('http://foo.com')
      .filteringPath(/\?.*/g, '?xxx')
      .post('/orders?xxx', {})
      .reply(400, { success: true });

    rOAuth.complete('post', '/orders', {}, err => {
      err.should.be.an.instanceof(Error);
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
      err.should.be.an.instanceof(Error);
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
      err.should.be.an.instanceof(Error);
      err.message.should.match(/Unexpected token </);
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
      data.should.be.an.instanceof(Object)
        .and.have.property('success', true);
      api.done();
      done();
    });
  });

  it('Should support data for GET requests', done => {
    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    const api = nock('https://foo.com/')
      .get('/orders')
      .query({
        consumer_key: 'foo',
        consumer_secret: 'foo',
        filter: {
          limit: 10
        }
      })
      .reply(200, '{ "success": true }', {
        'content-type': 'application/json'
      });

    rBasic.complete('get', '/orders', { 'filter[limit]': 10 }, (err, data) => {
      should.not.exist(err);
      data.should.be.an.instanceof(Object)
        .and.have.property('success', true);
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
      data.should.be.an.instanceof(Object)
        .and.have.property('success', true);
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
      data.should.equal('<xml></xml>');
      api.done();
      done();
    });
  });

  it('Should return an error if "errors" are found in the response', done => {
    const api = nock('https://foo.com')
      .filteringPath(/\?.*/g, '?xxx')
      .get('/errors?xxx')
      .reply(200, '{ "errors": ["An error has occurred."] }', {
        'content-type': 'application/json'
      });

    rBasic.complete('get', '/errors', {}, err => {
      api.done();
      err.should.be.an.instanceof(Error);
      err.message.should.equal('["An error has occurred."]');
      done();
    });
  });
});
