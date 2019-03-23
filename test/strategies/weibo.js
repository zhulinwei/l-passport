const sinon = require('sinon');
const assert = require('assert');
const WeiboStrategy = require('../../lib/strategies/weibo');

const config = {
  appId: 'YOUR_WEIBO_APP_ID',
  appSecret: 'YOUR_WEIBO_APP_SECRET'
};

class WeiboStub {
  constructor (weiboStrategy) {
    this.token = {};
    this.openId = {};
    this.userInfo = {};
    this.weiboStrategy = weiboStrategy;
  }

  tokenStub () {
    this.token = sinon.stub(this.weiboStrategy, 'getTokenByCode').callsFake(() => {
      return { uid: 'uid', accessToken: 'access_token' };
    });
  }

  userInfoStub () {
    this.userInfo = sinon.stub(this.weiboStrategy, 'getUserInfo').callsFake(() => {
      return { idstr: 'id', screen_name: 'nickname' };
    });
  }

  clearTokenStub () {
    this.token.restore();
  }

  clearUserInfoStub () {
    this.userInfo.restore();
  }
}

const weiboStrategy = new WeiboStrategy(config);
const weiboStub = new WeiboStub(weiboStrategy);

describe('weibo login', () => {
  it('get weibo token by code', async () => {
    weiboStub.tokenStub();
    const code = 'WEIBO_CODE';
    const appId = 'APPID';
    const secret = 'APPSECRET';
    const redirect = 'WEIBO_REDIRECT';
    const result = await weiboStrategy.getTokenByCode({ appId, secret, code, redirect });
    assert.ok(result.accessToken);
    weiboStub.clearTokenStub();
  });

  it('get weibo userinfo', async () => {
    weiboStub.userInfoStub();
    const appId = 'APPID';
    const openId = 'USER_OPENID';
    const accessToken = 'USER_ACCESS_TOKEN';
    const result = await weiboStrategy.getUserInfo(appId, openId, accessToken);
    assert.ok(result.idstr);
    weiboStub.clearUserInfoStub();
  });

  it('get weibo authorize url', () => {
    const redirect = 'WEIBO_REDIRECT';
    const redirectUrl = weiboStrategy.getAuthorizeUrl(redirect);
    assert.ok(redirectUrl);
  });

  it('start authorize', async () => {
    weiboStub.tokenStub();
    weiboStub.userInfoStub();

    const user = await weiboStrategy.authorize('WEIBO_CODE', 'WEIBO_REDIRECT');
    assert.ok(user.uid);
    weiboStub.clearTokenStub();
    weiboStub.clearUserInfoStub();
  });
});
