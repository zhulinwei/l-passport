const utils = require('util');
const Base = require('./base');
const Enum = require('./enum');
const queryString = require('querystring');
const request = require('request-promise-native');

const APPID = Symbol('appId');
const APPKEY = Symbol('appKey');

class QQStrategy extends Base {
  constructor(config) {
    super();
    this[APPID] = config.appId;
    this[APPKEY] = config.appKey;
    this.request = request.defaults({
      forever: true,
      timeout: 10000,
      json: true,
      baseUrl: 'https://graph.qq.com'
    });
  }

  async _getToken(code, appId, appKey, redirect) {
    return await this.request({
      method: 'GET',
      url: '/oauth2.0/token',
      qs: {
        code,
        client_id: appId,
        client_secret: appKey,
        redirect_uri: redirect,
        grant_type: 'authorization_code',
      }
    });
  }

  async __getOpenId(accessToken) {
    return await this.request({
      method: 'GET',
      url: '/oauth2.0/me',
      qs: {
        access_token: accessToken
      }
    });
  }

  async _getUserInfo(appId, openId, accessToken) {
    return await this.request({
      method: 'GET',
      url: '/user/get_user_info',
      qs: {
        openid: openId,
        access_token: accessToken,
        oauth_consumer_key: appId,
      }   
    });
  }

  _format(user) {
    if (!user) throw Error('无效的用户信息！');
    return {
      body: user,
      openId: user.openId,
      nickname: user.nickname,
      avatar: user.figureurl_qq_2 || user.figureurl_qq_1,
      provider: Enum.PlatformProvider.QQ,
    };
  }

  async authorize(options) {
    const appId = this[APPID];
    const appKey = this[APPKEY];
    if (!(appId || appKey)) throw Error('无效的配置信息！');
    const code = options.query.code;
    const redirect = options.url.substr(0, options.url.indexOf('code')-1);
    const qqTokenCallback = await this._getToken(code, appId, appKey, redirect);
    const qqToken = utils.isString(qqTokenCallback) ? queryString.parse(qqTokenCallback) : {};
    if (!(qqToken && qqToken.access_token && qqToken.refresh_token)) throw Error('获取QQ授权失败，无法获取用户令牌！'); 
    const accessToken = qqToken.access_token;
    const refreshToken = qqToken.refresh_token;
    
    const qqOpenIdCallback = await this.__getOpenId(accessToken);
    const qqOpenId = utils.isString(qqOpenIdCallback) ? JSON.parse(qqOpenIdCallback.replace('callback(', '').replace(');', '')) : {};
    if (!(qqOpenId && qqOpenId.openid)) throw Error('获取QQ授权失败，无法获取用户编号！');
    const openId = qqOpenId.openid;
    const user = await this._getUserInfo(appId, openId, accessToken);
    if (!user.nickname) throw Error('获取QQ授权失败，无法获取用户信息！'); 

    return this._format(Object.assign({ openId, accessToken, refreshToken }, user));
  }
}

module.exports = QQStrategy;
