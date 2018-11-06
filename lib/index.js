const _ = require('lodash');
const util = require('util');
const Enum = require('./enum');
const QQStrategy = require('./strategies/qq');
const BaiduStrategy = require('./strategies/baidu');
const WeiboStrategy = require('./strategies/weibo');
const WechatStrategy = require('./strategies/wechat');

function checkConfig(config) {
  const provider = config.provider;
  if (!provider) throw Error('provider missing');
  if (this._configs[provider]) throw Error(`provider ${provider} already exist`);
  if (!this._strategies[provider]) throw Error(`the strategy of ${provider} is not existed`);
  if (!config.appId && !config.appSecret && !config.clients) throw Error('appId or appSecret missing');
}

function saveConfig(config) {
  if (config.clients && Array.isArray(config.clients)) this._configs[config.provider] = [].concat(configs.clients);
  if (config.appId && config.appSecret && !config.clients) this._configs[config.provider] = [].concat(config);
}

class Passport {
  constructor() {
    this._configs = {};
    this._strategies = {};
  }
  
  use(name, strategy) {
    if (!name) throw new Error('Authentication strategies must have a name');
    this._strategies[name] = strategy;
  }

  setConfigs(configs) {
    for (let config of configs) {
      checkConfig.bind(this)(config);
      saveConfig.bind(this)(config);
    }
  }

  getConfig(provider, options) {
    const configs = this._configs[provider];
    if (!configs) throw new Error(`the config of ${provider} is not existed`);
    
    if (!options) return configs[0];
    return configs.find(client => Object.keys(options).reduce((result, key)=> result && options[key] === client[key]));
  } 
  
  authorization(provider, options) {
    const passport = this;
    const Strategy = this._strategies[provider];
    if (!Strategy) throw new Error(`the strategy of ${provider} is not existed`);
    if (options && !util.isObject(options)) throw new Error('option must be object');

    return async function authorization(ctx, next) {
      if (ctx.state.passport) return await next();
      
      const config = passport.getConfig(provider, options); 
      const strategy = new Strategy(config);

      const code = ctx.query.code;
      const state = ctx.query.state || config.state || '';
      const scope = ctx.query.scope || config.scope || '';
      const redirect = ctx.query.redirect || config.redirect || '';

      if (!code) {
        const redirectUrl = strategy.getAuthorizeUrl(redirect, state, scope);
        return ctx.redirect(redirectUrl);
      } else ctx.state.passport = await strategy.authorize(code, redirect);
      await next();
    }
  }
}

// add new strategy
const passport = new Passport();

passport.use('qq', QQStrategy);
passport.use('baidu', BaiduStrategy);
passport.use('weibo', WeiboStrategy);
passport.use('wechat', WechatStrategy);

module.exports = passport;
