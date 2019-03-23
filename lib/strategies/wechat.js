const Base = require('./base');
const Enum = require('../enum');
const PassportError = require('../error');

const queryString = require('querystring');

const APPID = Symbol('appId');
const APPSECRET = Symbol('appSecret');

class WechatStrategy extends Base {
  constructor (config = {}) {
    super();
    this[APPID] = config.appId;
    this[APPSECRET] = config.appSecret;
  }

  async getTokenByCode (appId, secret, code) {
    const result = await this._send({
      method: 'GET',
      url: 'https://api.weixin.qq.com/sns/oauth2/access_token',
      qs: {
        code,
        appid: appId,
        secret: secret,
        grant_type: 'authorization_code'
      }
    });
    if (!result || !result.access_token || !result.openid) {
      const errmsg = result && result.errmsg ? result.errmsg : 'unknown error';
      throw new PassportError(`failed to get wechat token: ${errmsg}`);
    }
    return { openId: result.openid, accessToken: result.access_token, refreshToken: result.refresh_token };
  }

  async getUserInfo (openId, accessToken) {
    const result = await this._send({
      method: 'GET',
      url: 'https://api.weixin.qq.com/sns/userinfo',
      qs: {
        openid: openId,
        access_token: accessToken
      }
    });
    if (!result || !result.openid) {
      const errmsg = result && result.errmsg ? result.errmsg : 'unknown error';
      throw new PassportError(`failed to get wechat userinfo: ${errmsg}`);
    }
    return result;
  }

  _format (user) {
    if (!user) throw new PassportError('invalid user information');

    return {
      body: user,
      uid: user.openId,
      avatar: user.headimgurl,
      nickname: user.nickname,
      provider: Enum.PlatformProvider.WECHAT
    };
  }

  getAuthorizeUrl (redirect, state, scope) {
    if (!this[APPID]) throw new PassportError('failed to get authorize url: appId missing');

    const url = 'https://open.weixin.qq.com/connect/oauth2/authorize';
    const query = {
      appid: this[APPID],
      redirect_uri: redirect,
      response_type: 'code',
      scope: scope || 'snsapi_userinfo',
      state: state || ''
    };
    return `${url}?${queryString.stringify(query)}#wechat_redirect`;
  }

  async authorize (code) {
    const appId = this[APPID];
    const secret = this[APPSECRET];
    if (!(appId || secret)) throw new PassportError('appId or appSecret missing！');
    const { openId, accessToken, refreshToken } = await this.getTokenByCode(appId, secret, code);
    const user = await this.getUserInfo(openId, accessToken);
    return this._format(Object.assign({ openId, accessToken, refreshToken }, user));
  }
}

module.exports = WechatStrategy;
