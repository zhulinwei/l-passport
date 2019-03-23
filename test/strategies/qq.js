const sinon = require('sinon');
const assert = require('assert');
const QQStrategy = require('../../lib/strategies/qq');

const config = {
  appId: 'YOUR_QQ_APP_ID',
  appSecret: 'YOUR_QQ_APP_SECRET'
};

class QQStub {
  constructor (qqStrategy) {
    this.token = {};
    this.openId = {};
    this.userInfo = {};
    this.qqStrategy = qqStrategy;
  }

  tokenStub () {
    this.token = sinon.stub(this.qqStrategy, 'getTokenByCode').callsFake(() => {
      return { accessToken: 'access_token', refreshToken: 'refresh_token' };
    });
  }

  openIdStub () {
    this.openId = sinon.stub(this.qqStrategy, 'getOpenIdByToken').callsFake(() => {
      return { openId: 'openid' };
    });
  }

  userInfoStub () {
    this.userInfo = sinon.stub(this.qqStrategy, 'getUserInfo').callsFake(() => {
      return { nickname: 'nickname' };
    });
  }

  clearTokenStub () {
    this.token.restore();
  }

  clearOpenIdStub () {
    this.openId.restore();
  }

  clearUserInfoStub () {
    this.userInfo.restore();
  }
}

const qqStrategy = new QQStrategy(config);
const qqStub = new QQStub(qqStrategy);

describe('qq login', () => {
  it('get qq token by code', async () => {
    qqStub.tokenStub();
    const code = 'QQ_CODE';
    const appId = 'APPID';
    const secret = 'APPSECRET';
    const redirect = 'QQ_REDIRECT';
    const result = await qqStrategy.getTokenByCode({ appId, secret, code, redirect });
    assert.ok(result.accessToken);
    qqStub.clearTokenStub();
  });

  it('get qq openId by accessToken', async () => {
    qqStub.openIdStub();
    const accessToken = 'QQ_ACCESS_TOKEN';
    const result = await qqStrategy.getOpenIdByToken(accessToken);
    assert.ok(result.openId);
    qqStub.clearOpenIdStub();
  });

  it('get qq userinfo', async () => {
    qqStub.userInfoStub();
    const appId = 'APPID';
    const openId = 'USER_OPENID';
    const accessToken = 'USER_ACCESS_TOKEN';
    const result = await qqStrategy.getUserInfo(appId, openId, accessToken);
    assert.ok(result.nickname);
    qqStub.clearUserInfoStub();
  });

  it('get qq authorize url', () => {
    const redirect = 'QQ_REDIRECT';
    const redirectUrl = qqStrategy.getAuthorizeUrl(redirect);
    assert.ok(redirectUrl);
  });

  it('start authorize', async () => {
    qqStub.tokenStub();
    qqStub.openIdStub();
    qqStub.userInfoStub();

    const user = await qqStrategy.authorize('QQ_CODE');
    assert.ok(user.uid);
    qqStub.clearTokenStub();
    qqStub.clearOpenIdStub();
    qqStub.clearUserInfoStub();
  });
});
