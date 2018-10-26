const utils = require('util');
const Base = require('./base');
const Enum = require('../enum');
const queryString = require('querystring');
const request = require('request-promise-native');

const APPID = Symbol('appId');
const APPKEY = Symbol('appKey');

class BaiduStrategy extends Base {
  constructor(config) {
    super();
    this[APPID] = config.appId;
    this[APPKEY] = config.appKey;
    this.request = request.defaults({
      forever: true,
      timeout: 10000,
      json: true,
      baseUrl: 'https://openapi.baidu.com'
    });
  }

  async _getToken(code, appId, appKey, redirect) {
    return await this.request({
      method: 'GET',
      url: '/oauth/2.0/token',
      qs: {
        code,
        client_id: appId,
        client_secret: appKey,
        redirect_uri: redirect,
        grant_type: 'authorization_code',
      }
    });
  }

  async _getUserInfo(openId, accessToken) {
    return await this.request({
      method: 'GET',
      url: '/rest/2.0/cambrian/sns/userinfo',
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
      provider: Enum.PlatformProvider.BAIDU,
    };
  }

  async authorize(options) {
    const appId = this[APPID];
    const appKey = this[APPKEY];
    if (!(appId || appKey)) throw Error('无效的配置信息！');
    const code = options.query.code;
    const redirect = options.url.substr(0, options.url.indexOf('code')-1).replace('http:', 'https:');
    const baiduToken = await this._getToken(code, appId, appKey, redirect);
    if (!(baiduToken && baiduToken.access_token && baiduToken.openid)) throw Error('获取百度授权失败：无法获取百度用户令牌!');
    const openId = baiduToken.openid;
    const accessToken = baiduToken.access_token;
    const refreshToken = baiduToken.refresh_token;

    const user = await this._getUserInfo(openId, accessToken);
    if (!user.openid) throw Error('获取百度授权失败，无法获取用户信息！'); 

    return this._format(Object.assign({ openId, accessToken, refreshToken }, user));
  }
}

module.exports = BaiduStrategy;
