const Passport = require('./lib/passport');

const passport = new Passport();
// add strategy
passport.use('qq', QQStrategy);
passport.use('baidu', BaiduStrategy);
passport.use('weibo', WeiboStrategy);
passport.use('wechat', WechatStrategy);

module.exports = passport;
