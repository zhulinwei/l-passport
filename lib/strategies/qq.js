const util = require('util');
const Base = require('./base');
const Enum = require('../enum');
const queryString = require('querystring');
const request = require('request-promise-native');

const APPID = Symbol('appId');
const APPSECRET = Symbol('appSecret');

function parseResponse(response) {
  if (!util.isString(response)) return response;
  if (!response.includes('callback')) return queryString.parse(response);
  return JSON.parse(response.replace('callback(', '').replace(');', ''));
}

class QQStrategy extends Base {
  constructor(config) {
    super();
    this[APPID] = config.appId;
    this[APPSECRET] = config.appSecret;
    this.baseUrl = 'https://graph.qq.com';
    this.request = request.defaults({ forever: true, timeout: 10000, json: true, baseUrl: this.baseUrl });
  }

  async getTokenByCode(options) {
    const { appId, secret, code, redirect } = options;
    const resultInString = await this.request({
      method: 'GET',
      url: '/oauth2.0/token',
      qs: {
        code,
        client_id: appId,
        client_secret: secret,
        redirect_uri: redirect,
        grant_type: 'authorization_code',
      }
    });
    const result = parseResponse(resultInString);
    if (!result || !result.access_token  && !result.refresh_token) {
      const errmsg = result && result.error_description ? result.error_description : 'unknown error';
      throw Error(`failed to get qq token: ${errmsg}`);
    }
    return { accessToken: result.access_token, refreshToken: result.refresh_token };
  }

  async getOpenIdByToken(accessToken) {
    const resultInString = await this.request({
      method: 'GET',
      url: '/oauth2.0/me',
      qs: {
        access_token: accessToken
      }
    });
    
    const result = parseResponse(resultInString);
    if (!result || !result.openid) {
      const errmsg = result && result.error_description ? result.error_description : 'unknown error';
      throw Error(`failed to get qq token: ${errmsg}`);
    }
    return { openId: result.openid };
  }

  async getUserInfo(appId, openId, accessToken) {
    const result = await this.request({
      method: 'GET',
      url: '/user/get_user_info',
      qs: {
        openid: openId,
        access_token: accessToken,
        oauth_consumer_key: appId,
      }   
    });
    if (!result || !result.nickname) {
      const errmsg = result && result.errmsg ? result.errmsg : 'unknown error';
      throw Error(`failed to get qq token: ${errmsg}`);
    }
    return result;
  }

  getAuthorizeUrl(redirect, state, scope) {
    if (!this[APPID]) throw Error('failed to get authorize url: appId missing');
    const url = 'https://graph.qq.com/oauth2.0/authorize';
    const query = {
      client_id: this[APPID],
      redirect_uri: redirect,
      response_type: 'code',
      scope: scope || 'get_user_info',
      state: state || ''
    };
    return `${url}?${queryString.stringify(query)}`;
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

  async authorize(code, redirect) {
    const appId = this[APPID];
    const secret = this[APPSECRET];
    if (!(appId || secret)) throw Error('appId or appSecret missing');
    const { accessToken, refreshToken } = await this.getTokenByCode({ code, appId, secret, redirect });
    const { openId } = await this.getOpenIdByToken(accessToken);
    const user = await this.getUserInfo(appId, openId, accessToken);
    return this._format(Object.assign({ openId, accessToken, refreshToken }, user));
  }
}

module.exports = QQStrategy;
