'use strict';

const WooCommerce = require('../lib/woocommerce'),
  Request = require('../lib/request'),
  chai = require('chai'),
  sinon = require('sinon');

const should = chai.should();

describe('WooCommerce', () => {
  const self = { };

  beforeEach(() => self.sandbox = sinon.sandbox.create());
  afterEach(() => self.sandbox.restore());

  describe('Constructor: #WooCommerce', () => {
    it('Should throw an error if the consumerKey or secret are missing', () => {
      should.throw(() => {
        new WooCommerce();
      }, Error);
    });

    it('Should throw an error if the url is missing', () => {
      should.throw(() => {
        new WooCommerce({
          consumerKey: 'foo',
          secret: 'foo'
        });
      }, Error);
    });

    it('Should set the correct default when requirements are met', () => {
      const wc = new WooCommerce({
        url: 'foo.com',
        consumerKey: 'foo',
        secret: 'foo'
      });

      wc.options.logLevel.should.equal(0);
      wc.options.ssl.should.equal(false);
      wc.options.apiPath.should.equal('/wc-api/v2');
      wc.options.legacy.should.equal(true);
    });

    it('Should set the correct ssl default for https', () => {
      const wc = new WooCommerce({
        url: 'https://foo.com',
        consumerKey: 'foo',
        secret: 'foo'
      });

      wc.options.ssl.should.equal(true);
    });

    it('Should set the correct ssl default for http', () => {
      const wc = new WooCommerce({
        url: 'http://foo.com',
        consumerKey: 'foo',
        secret: 'foo'
      });

      wc.options.ssl.should.equal(false);
    });

    it('should set legacy to false for new api', () => {
      const wc = new WooCommerce({
        url: 'http://foo.com',
        consumerKey: 'foo',
        secret: 'foo',
        apiPath: '/wp-json/wc/v1'
      });

      wc.options.legacy.should.equal(false);
    });
  });

  describe('Helper Methods: #WooCommerce', () => {
    const wc = new WooCommerce({
      url: 'foo.com',
      consumerKey: 'foo',
      secret: 'foo'
    });

    beforeEach(() => {
      self.completeStub = self.sandbox.stub(Request.prototype, 'complete')
        .yields();
    });

    afterEach(() => sinon.assert.calledOnce(self.completeStub));

    describe('Get', () => {
      it('Should call the request', done => {
        wc.get('/foo', done);
      });
    });

    describe('Post', () => {
      it('Should call the request', done => {
        wc.post('/foo', {}, done);
      });
    });

    describe('Put', () => {
      it('Should call the request', done => {
        wc.put('/foo', {}, done);
      });
    });

    describe('Delete', () => {
      it('Should call the request', done => {
        wc.delete('/foo', done);
      });
    });
  });
});
