const Passport = require('./lib');
const QQStrategy = require('./lib/strategies/qq');
const BaiduStrategy = require('./lib/strategies/baidu');
const WeiboStrategy = require('./lib/strategies/weibo');
const WechatStrategy = require('./lib/strategies/wechat');

const passport = new Passport();
// add strategy
passport.use('qq', QQStrategy);
passport.use('baidu', BaiduStrategy);
passport.use('weibo', WeiboStrategy);
passport.use('wechat', WechatStrategy);

module.exports = passport;
