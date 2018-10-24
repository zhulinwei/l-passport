class StrategyBase {
  
  __validOptions(options) {
    if (!options) throw Error('options是必须的');
    if (!options.url) throw Error('url参数是必须的');
    if (!options.body) throw Error('body参数是必须的');
    if (!options.query) throw Error('query参数是必须的');
    if (!options.params) throw Error('params参数是必须的');
    return true;
  }

  authorize() {
    throw Error('授权功能未实现');
  }

  authenticate() {
    throw Error('认证功能未实现');
  }

  async execute(options) {
    if (this.__validOptions(options)) {
      const authorization = await this.authorize(options);
      return this.authenticate(authorization);
    }
    return void(0);
  }
}

module.exports = StrategyBase;

