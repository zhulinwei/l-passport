const utils = require('./utils');
const PassportError = require('./error');

function getProviderConfig (configs = [], options) {
  if (!options) return configs[0];
  return configs.find(client => Object.keys(options).reduce((result, key) => result && options[key] === client[key]));
}

class Passport {
  constructor () {
    this._configs = {};
    this._strategies = {};
  }
  use (name, strategy) {
    if (!name || typeof name !== 'string') throw new PassportError('Authentication strategies must have a name');
    if (!strategy || typeof strategy !== 'function') throw new PassportError('Authentication strategies must be a function');
    this._strategies[name] = strategy;
  }

  initialize (configs) {
    if (!(configs instanceof Array)) configs = [].concat(configs);
    for (let config of configs) {
      let provider = config.provider;
      if (!provider) throw new PassportError('provider missing');
      if (this._configs[provider]) throw new PassportError(`provider ${provider} already exist`);
      if (!this._strategies[provider]) throw new PassportError(`the strategy of ${provider} is not existed`);
      if (!config.appId && !config.appSecret && !config.clients) throw new PassportError('appId or appSecret missing');
      if (config.clients && Array.isArray(config.clients)) this._configs[config.provider] = [].concat(config.clients);
      if (config.appId && config.appSecret && !config.clients) this._configs[config.provider] = [].concat(config);
    }
  }

  authorization (provider, options) {
    if (options && !utils.isObject(options)) throw new PassportError('option must be object');
    if (!provider || !utils.isString(provider)) throw new PassportError('provider name must be a string');
    if (!this._strategies[provider]) throw new PassportError(`the strategy of ${provider} is not existed`);

    return async (ctx, next) => {
      if (ctx.state.passport) return;
      const config = getProviderConfig(this._configs[provider]) || {};

      const code = ctx.query.code;
      const state = ctx.query.state || config.state || '';
      const scope = ctx.query.scope || config.scope || '';
      const redirect = ctx.query.redirect || config.redirect || '';
      const strategy = new this._strategies[provider](config);

      if (!code) {
        const redirectUrl = strategy.getAuthorizeUrl(redirect, state, scope);
        return ctx.redirect(redirectUrl);
      } else ctx.state.passport = await strategy.authorize(code, redirect);
      await next();
    };
  }
}

module.exports = Passport;
