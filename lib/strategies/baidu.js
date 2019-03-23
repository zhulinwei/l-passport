const Base = require('./base');
const Enum = require('../enum');
const PassportError = require('../error');

const queryString = require('querystring');

const APPID = Symbol('appId');
const APPSECRET = Symbol('appSecret');

class BaiduStrategy extends Base {
  constructor (config = {}) {
    super();
    this[APPID] = config.appId;
    this[APPSECRET] = config.appSecret;
  }

  async getTokenByCode (options) {
    const { appId, secret, code, redirect } = options;
    const result = await this._send({
      method: 'GET',
      url: 'https://openapi.baidu.com/oauth/2.0/token',
      qs: {
        code,
        client_id: appId,
        client_secret: secret,
        redirect_uri: redirect,
        grant_type: 'authorization_code'
      }
    });
    if (!result || !result.access_token || !result.openid) {
      const errmsg = result && result.error && result.error.error_description ? result.error.error_description : 'unknown error';
      throw new PassportError(`failed to get baidu token: ${errmsg}`);
    }
    return { openId: result.openid, accessToken: result.access_token, refreshToken: result.refresh_token };
  }

  async getUserInfo (openId, accessToken) {
    const result = await this._send({
      method: 'GET',
      url: 'https://openapi.baidu.com/rest/2.0/cambrian/sns/userinfo',
      qs: {
        openid: openId,
        access_token: accessToken
      }
    });
    if (!result || !result.openid) {
      const errmsg = result && result.errmsg ? result.errmsg : 'unknown error';
      throw new PassportError(`failed to get baidu userinfo: ${errmsg}`);
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
      provider: Enum.PlatformProvider.BAIDU
    };
  }

  getAuthorizeUrl (redirect, state, scope) {
    if (!this[APPID]) throw new PassportError('failed to get authorize url: appId missing');
    const url = 'https://openapi.baidu.com/oauth/2.0/authorize';
    const query = {
      client_id: this[APPID],
      redirect_uri: redirect,
      response_type: 'code',
      scope: scope || 'snsapi_userinfo'
    };
    return `${url}?${queryString.stringify(query)}`;
  }

  async authorize (code, redirect) {
    const appId = this[APPID];
    const secret = this[APPSECRET];
    if (!(appId || secret)) throw new PassportError('appId or appSecret missing');
    const { openId, accessToken, refreshToken } = await this.getTokenByCode({ appId, secret, code, redirect });
    const user = await this.getUserInfo(openId, accessToken);

    return this._format(Object.assign({ openId, accessToken, refreshToken }, user));
  }
}

module.exports = BaiduStrategy;
