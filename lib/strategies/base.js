const request = require('request-promise-native');

class StrategyBase {
  async _send(options) {
    try {
      return await request(Object.assign({ forever: true, timeout: 10000, json: true }, options));
    } catch (error) {
      return error; 
    } 
  }

  getAuthorizeUrl() {
    throw Error('function getAuthorizeUrl is unrealized');
  }
    
  authorize() {
    throw Error('function authorize is unrealized');
  }
}

module.exports = StrategyBase;

