const utils = require('util');
const Base = require('./base');
const Enum = require('./enum');
const queryString = require('querystring');
const request = require('request-promise-native');

const APPID = Symbol('appId');
const APPKEY = Symbol('appKey');

class WechatStrategy extends Base {
  constructor(config) {
    super();
    this[APPID] = config.appId;
    this[APPKEY] = config.appKey;
    this.request = request.defaults({
      forever: true,
      timeout: 10000,
      json: true,
      baseUrl: 'https://api.weixin.qq.com'
    });
  }

  async _getToken(code, appId, appKey) {
    return await this.request({
      method: 'GET',
      url: '/sns/oauth2/access_token',
      qs: {
        code,
        appid: appId,
        secret: appKey,
        grant_type: 'authorization_code',
      }
    });
  }

  async _getUserInfo(openId, accessToken) {
    return await this.request({
      method: 'GET',
      url: '/sns/userinfo',
      qs: {
        openid: openId,
        access_token: accessToken,
      }   
    });
  }

  _format(user) {
    if (!user) throw Error('无效的用户信息！');
    return {
      body: user,
      openId: user.openId,
      avatar: user.headimgurl,
      nickname: user.nickname,
      provider: Enum.PlatformProvider.WECHAT,
    };
  }

  async authorize(options) {
    const appId = this[APPID];
    const appKey = this[APPKEY];
    if (!(appId || appKey)) throw Error('无效的配置信息！');
    const code = options.query.code;
    const wechatToken = await this._getToken(code, appId, appKey);
    if (!(wechatToken && wechatToken.access_token && wechatToken.openid)) throw Error('获取微信授权失败：无法获取微信用户令牌!');
    const openId = wechatToken.openid;
    const accessToken = wechatToken.access_token;
    const refreshToken = wechatToken.refresh_token;

    const user = await this._getUserInfo(openId, accessToken);
    if (!user.openid) throw Error('获取微信授权失败，无法获取用户信息！'); 

    return this._format(Object.assign({ openId, accessToken, refreshToken }, user));
  }
}

module.exports = WechatStrategy;
