const sinon = require('sinon');
const assert = require('assert');
const WechatStrategy = require('../../lib/strategies/wechat');

const config = {
  appId: 'YOUR_WECHAT_APP_ID',
  appSecret: 'YOUR_WECHAT_APP_SECRET'
};

class WechatStub {
  constructor (wechatStrategy) {
    this.token = {};
    this.userInfo = {};
    this.wechatStrategy = wechatStrategy;
  }

  tokenStub () {
    this.token = sinon.stub(this.wechatStrategy, 'getTokenByCode').callsFake(() => {
      return { openId: 'openid', accessToken: 'access_token', refreshToken: 'refresh_token' };
    });
  }

  userInfoStub () {
    this.userInfo = sinon.stub(this.wechatStrategy, 'getUserInfo').callsFake(() => {
      return { openid: 'openid', unionid: 'unionid', nickname: 'nickname', headimgurl: 'headimgurl' };
    });
  }

  clearTokenStub () {
    this.token.restore();
  }

  clearUserInfoStub () {
    this.userInfo.restore();
  }
}

const wechatStrategy = new WechatStrategy(config);
const wechatStub = new WechatStub(wechatStrategy);

describe('wechat login', () => {
  it('get wechat token by code', async () => {
    wechatStub.tokenStub();
    const code = 'WECHAT_CODE';
    const result = await wechatStrategy.getTokenByCode(config.appId, config.appSecret, code);
    assert.ok(result.openId);
    wechatStub.clearTokenStub();
  });

  it('get wechat userinfo', async () => {
    wechatStub.userInfoStub();
    const openId = 'USER_OPENID';
    const accessToken = 'USER_ACCESS_TOKEN';
    const result = await wechatStrategy.getUserInfo(openId, accessToken);
    assert.ok(result.openid);
    wechatStub.clearUserInfoStub();
  });

  it('get wechat authorize url', () => {
    const redirect = 'WECHAT_REDIRECT';
    const redirectUrl = wechatStrategy.getAuthorizeUrl(redirect);
    assert.ok(redirectUrl);
  });

  it('start authorize', async () => {
    wechatStub.tokenStub();
    wechatStub.userInfoStub();

    const user = await wechatStrategy.authorize('WECHAT_CODE');
    assert.ok(user.uid);
    wechatStub.clearTokenStub();
    wechatStub.clearUserInfoStub();
  });
});
