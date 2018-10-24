const _ = require('lodash');
const QQStrategy = require('./strategies/qq');
const BaiduStrategy = require('./strategies/baidu');
const WeiboStrategy = require('./strategies/weibo');
const WechatStrategy = require('./strategies/wechat');

function getStrategyConfig(platform, client) {
  if (!platform) throw new Error('无效的登陆平台');
  if (![Enum.PlatformProvider.QQ, Enum.PlatformProvider.BAIDU, Enum.PlatformProvider.WEIBO, Enum.PlatformProvider.WECHAT].includes(platform))
    throw new Error('不合法的登陆平台');
  const platformConfig = _.find(configs.authorization, authenticator => authenticator.platform === platform);
  if (!platformConfig) throw new Error('无效的平台信息');
  const clientConfig = _.find(platformConfig.clients, client => client.type === client);
  if (!clientConfig) throw new Error('无效的客户端信息');
  return clientConfig;
}

class Passport {
  constructor() {
    this.configs = [];
    this.strategies = {};
  }
  
  use(name, strategy) {
    if (!name) throw Error('策略必须需要名字！');
    this.strategies[name] = strategy;
  }

  setConfig(configs) {
    if (!configs || !Array.isArray(configs)) throw Error('策略配置不正确');
    const invalidConfigs = _.some(configs, config => !config.platform || !clients || !Array.isArray(clients));
    if (invalidConfigs) throw Error('策略配置不正确');
    this.configs = [].concat(configs);

  }
  
  async authenticate(ctx, next) {
    if (ctx.state.passport) return await next();
    const { platform, client } = ctx.params;
    const config = platform === Enum.PlatformProvider.Local ? {} : getStrategyConfig(platform, client);
    const strategy = new Strategy(config);
    const options = {
      url: ctx.href,
      query: ctx.query,
      params: ctx.params,
      body: ctx.request.body
    };
    ctx.state.passport = await strategy.execute(options); 
    await next();
  }
}

// 新增策略
const passport = new Passport();

passport.use('qq', QQStrategy);
passport.use('baidu', BaiduStrategy);
passport.use('weibo', WeiboStrategy);
passport.use('local', LocalStrategy);
passport.use('wechat', WechatStrategy);

module.exports = passport;
