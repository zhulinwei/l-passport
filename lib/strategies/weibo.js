const Base = require('./base');
const Enum = require('../enum');
const queryString = require('querystring');
const request = require('request-promise-native');

const APPID = Symbol('appId');
const APPSECRET = Symbol('appSecret');

class WeiboStrategy extends Base {
  constructor(config) {
    super();
    this[APPID] = config.appId;
    this[APPSECRET ] = config.appSecret;
  }

  async getTokenByCode(options) {
    const { appId, secret, code, redirect } = options;
    const result = await this._send({
      method: 'POST',
      url: 'https://api.weibo.com/oauth2/access_token',
      qs: {
        code,
        client_id: appId,
        client_secret: secret,
        redirect_uri: redirect,
        grant_type: 'authorization_code',
      }
    });
    if (!result || !result.uid && !result.access_token) {
      const errmsg = result && result.error && result.error.error_description ? result.error.error_description  : 'unknown error';
      throw Error(`failed to get qq token: ${errmsg}`);
    }

    return { uid: result.uid, accessToken: result.access_token };
  }

  async getUserInfo(uid, accessToken) {
    const result = await this._send({
      method: 'GET',
      url: 'https://api.weibo.com/2/users/show.json',
      qs: {
        uid,
        access_token: accessToken,
      }   
    });
    if (!result || !result.id) {
      const errmsg = result && result.error && result.error.error ? result.error.error : 'unknown error';
      throw Error(`failed to get qq userinfo: ${errmsg}`);
    }
    
    return result;
  }

  getAuthorizeUrl(redirect, state, scope) {
    if (!this[APPID]) throw Error('failed to get authorize url: appId missing');
    const url = 'https://api.weibo.com/oauth2/authorize';
    const query = {
      client_id: this[APPID],
      redirect_uri: redirect,
      response_type: 'code',
      scope: scope || 'snsapi_userinfo',
      state: state || ''
    };
    return `${url}?${queryString.stringify(query)}`;
  }

  _format(user) {
    if (!user) throw Error('无效的用户信息！');
    return {
      body: user,
      uid: user.idstr,
      avatar: user.avatar_large,
      nickname: user.screen_name,
      provider: Enum.PlatformProvider.WEIBO,
    };
  }

  async authorize(code, redirect) {
    const appId = this[APPID];
    const secret = this[APPSECRET];
    if (!(appId || secret)) throw Error('appId or appSecret missing');
    const { uid, accessToken } = await this.getTokenByCode({ code, appId, secret, redirect });
    const user = await this.getUserInfo(uid, accessToken);
    return this._format(Object.assign({ uid, accessToken }, user));
  }
}

module.exports = WeiboStrategy;
