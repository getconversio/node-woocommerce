'use strict';

const logger = require('../lib/logger'),
  sinon = require('sinon');

describe('logger', () => {
  const self = { };

  beforeEach(() => self.sandbox = sinon.sandbox.create());
  afterEach(() => self.sandbox.restore());

  it('Should be set to a log level of zero by default', () => {
    logger.logLevel.should.equal(0);
  });

  it('Should log an error at any log level', () => {
    const spy = self.sandbox.spy(console, 'error');
    logger.error('Logging test error at 0');
    logger.level = 1;
    logger.error('Logging test error at 1');

    sinon.assert.calledTwice(spy);
  });

  it('Should log info at level one', () => {
    var spy = self.sandbox.spy(console, 'log');
    logger.logLevel = 1;
    logger.info('Logging test error at 1');

    sinon.assert.calledOnce(spy);
  });

  it('Should not log info at level zero', () => {
    const spy = self.sandbox.spy(console, 'log');
    logger.logLevel = 0;
    logger.info('Logging test error at 1');

    sinon.assert.notCalled(spy);
  });
});
