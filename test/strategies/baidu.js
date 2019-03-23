const sinon = require('sinon');
const assert = require('assert');
const BaiduStrategy = require('../../lib/strategies/baidu');

const config = {
  appId: 'YOUR_BAIDU_APP_ID',
  appSecret: 'YOUR_BAIDU_APP_SECRET'
};

class BaiduStub {
  constructor (baiduStrategy) {
    this.token = {};
    this.openId = {};
    this.userInfo = {};
    this.baiduStrategy = baiduStrategy;
  }

  tokenStub () {
    this.token = sinon.stub(this.baiduStrategy, 'getTokenByCode').callsFake(() => {
      return { openId: 'openid', accessToken: 'access_token', refreshToken: 'refresh_token' };
    });
  }

  userInfoStub () {
    this.userInfo = sinon.stub(this.baiduStrategy, 'getUserInfo').callsFake(() => {
      return { openid: 'openid', nickname: 'nickname' };
    });
  }

  clearTokenStub () {
    this.token.restore();
  }

  clearUserInfoStub () {
    this.userInfo.restore();
  }
}

const baiduStrategy = new BaiduStrategy(config);
const baiduStub = new BaiduStub(baiduStrategy);

describe('baidu login', () => {
  it('get baidu token by code', async () => {
    baiduStub.tokenStub();
    const code = 'BAIDU_CODE';
    const appId = 'APPID';
    const secret = 'APPSECRET';
    const redirect = 'BAIDU_REDIRECT';
    const result = await baiduStrategy.getTokenByCode({ appId, secret, code, redirect });
    assert.ok(result.accessToken);
    baiduStub.clearTokenStub();
  });

  it('get baidu userinfo', async () => {
    baiduStub.userInfoStub();
    const appId = 'APPID';
    const openId = 'USER_OPENID';
    const accessToken = 'USER_ACCESS_TOKEN';
    const result = await baiduStrategy.getUserInfo(appId, openId, accessToken);
    assert.ok(result.nickname);
    baiduStub.clearUserInfoStub();
  });

  it('get baidu authorize url', () => {
    const redirect = 'BAIDU_REDIRECT';
    const redirectUrl = baiduStrategy.getAuthorizeUrl(redirect);
    assert.ok(redirectUrl);
  });

  it('start authorize', async () => {
    baiduStub.tokenStub();
    baiduStub.userInfoStub();

    const user = await baiduStrategy.authorize('BAIDU_CODE', 'BAIDU_REDIRECT');
    assert.ok(user.nickname);
    baiduStub.clearTokenStub();
    baiduStub.clearUserInfoStub();
  });
});
