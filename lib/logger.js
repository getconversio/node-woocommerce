'use strict';

module.exports = {
  /**
   * Log Levels:
   * 0: Error only
   * 1: Info and Error
   */
  logLevel: 0,
  info: function(message) {
    if (this.logLevel < 1) return;
    console.log('\x1b[36mInfo: \x1b[0m%s', message);
  },
  error: message => console.error('\x1b[31mError: \x1b[0m%s', message)
};
