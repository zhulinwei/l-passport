const _ = require('lodash');
const util = require('util');
const Enum = require('./enum');
const QQStrategy = require('./strategies/qq');
const BaiduStrategy = require('./strategies/baidu');
const WeiboStrategy = require('./strategies/weibo');
const WechatStrategy = require('./strategies/wechat');

// function getStrategyConfig(platform, client) {
//   if (!platform) throw new Error('无效的登陆平台');
//   if (![Enum.PlatformProvider.QQ, Enum.PlatformProvider.BAIDU, Enum.PlatformProvider.WEIBO, Enum.PlatformProvider.WECHAT].includes(platform))
//     throw new Error('不合法的登陆平台');
//   const platformConfig = _.find(configs.authorization, authenticator => authenticator.platform === platform);
//   if (!platformConfig) throw new Error('无效的平台信息');
//   const clientConfig = _.find(platformConfig.clients, client => client.type === client);
//   if (!clientConfig) throw new Error('无效的客户端信息');
//   return clientConfig;
// }

function checkConfig(config) {
  const provider = config.provider;
  if (!provider) throw Error('参数provider缺失');
  if (!this._strategies[provider]) throw Error('不存在的策略类型：', provider);
  if (this._configs[provider]) throw Error('请勿重复配置该策略配置：', provider);
  if (!config.appId && !config.appSecret && !config.clients) throw Error('配置格式不正确');
}

function saveConfig(config) {
  if (config.clients && Array.isArray(config.clients)) this._configs[config.provider] = [].concat(configs.clients);
  // if (config.appId && config.appSecret && !config.clients) this._configs[config.provider] = [{ appId: config.appId, appSecret: config.appSecret }];
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
    if (!configs) throw new Error('策略配置不完善');
    
    if (!options) return configs[0];
    return configs.find(client => Object.keys(options).reduce((result, key)=> result && options[key] === client[key]));
  } 
  
  authorization(provider, options) {
    const passport = this;
    const Strategy = this._strategies[provider];
    if (!Strategy) throw new Error('不存在的策略类型：', provider);
    if (options && !util.isObject(options)) throw new Error('option must be object');

    return async function authorization(ctx, next) {
      if (ctx.state.passport) return await next();
      
      const config = passport.getConfig(provider, options); 
      const strategy = new Strategy(config);
      const code = ctx.query.code;

      if (!code) {
        const state = ctx.query.state || config.state || '';
        const scope = ctx.query.scope || config.scope || '';
        const redirect = ctx.query.redirect || config.redirect || '';
        const redirectUrl = strategy.getAuthorizeUrl(redirect, state, scope);
        return ctx.redirect(redirectUrl);
      } else ctx.state.passport = await strategy.authorize(code);
      // const options = {
      //   url: ctx.href,
      //   query: ctx.query,
      //   params: ctx.params,
      //   body: ctx.request.body
      // };
      // ctx.state.passport = await strategy.execute({
      //   url: ctx.href,
      //   query: ctx.query,
      //   params: ctx.params,
      //   body: ctx.request.body
      // }); 
      await next();
    }
  }
}

// 新增策略
const passport = new Passport();

passport.use('qq', QQStrategy);
passport.use('baidu', BaiduStrategy);
passport.use('weibo', WeiboStrategy);
passport.use('wechat', WechatStrategy);

module.exports = passport;
