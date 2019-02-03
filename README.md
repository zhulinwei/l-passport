# l-passport

集成微信(wechat)、QQ(qq)、百度(baidu)和微博(weibo)于一体的koa中间件与API SDK

## 功能列表
- OAuth授权
- 获取用户基本信息

koa2中间件，开发者可以通过此中间件获取用户的基本信息（包括用户编号、昵称、头像）

## 交流群
QQ群：157964097，使用疑问，开发，贡献代码请加群。

## Installation

```sh
npm install l-passport -S
```

## Usage

### Authentication
引入l-passport并配置

```js
const passport = require('l-passport');

// 微信登录：设置appId与app secret
passport.initialize({
  provider: 'wechat'
  appId: 'your_app_id',
  appSecret: 'your_app_secret'
});

router.get('/login/wechat', passport.authorization('wechat'), async (ctx) => {
  ctx.body = ctx.state.passport;
});
```

如果需要配置多个平台（如web、ios、android），建议参考如下代码
```js
const passport = require('l-passport');

passport.initialize({
  provider: 'wechat', 
  clients: [
    { platform: 'web', appId: 'your_app_id', appSecret: 'your_app_secret' },
    { platform: 'ios', appId: 'your_app_id', appSecret: 'your_app_secret' },
    { platform: 'android', appId: 'your_app_id', appSecret: 'your_app_secret' },
  ]
});

router.get('/login/wechat_web', passport.authorization('wechat', { platform: 'web' }), async (ctx) => {
  ctx.body = ctx.state.passport;
});

router.get('/login/wechat_ios', passport.authorization('wechat', { platform: 'ios' }), async (ctx) => {
  ctx.body = ctx.state.passport;
});

router.get('/login/wechat_android', passport.authorization('wechat', { platform: 'android' }), async (ctx) => {
  ctx.body = ctx.state.passport;
});
```

如果需要配置多个服务提供商与多个平台，建议参考如下代码
```js
const passport = require('l-passport');

passport.initialize([
  {
    provider: 'wechat', 
    clients: [
      { platform: 'web', appId: 'your_app_id', appSecret: 'your_app_secret' },
      { platform: 'ios', appId: 'your_app_id', appSecret: 'your_app_secret' },
      { platform: 'android', appId: 'your_app_id', appSecret: 'your_app_secret' },
    ]
  },
  {
    provider: 'baidu', 
    clients: [
      { platform: 'web', appId: 'your_app_id', appSecret: 'your_app_secret', redirect: 'your_baidu_redirect' },
      { platform: 'ios', appId: 'your_app_id', appSecret: 'your_app_secret', redirect: 'your_baidu_redirect'},
      { platform: 'android', appId: 'your_app_id', appSecret: 'your_app_secret', redirect: 'your_baidu_redirect' },
    ]
  }
]);

router.get('/login/wechat_web', passport.authorization('wechat', { platform: 'web' }), async (ctx) => {
  ctx.body = ctx.state.passport;
});

router.get('/login/baidu_ios', passport.authorization('baidu', { platform: 'ios' }), async (ctx) => {
  ctx.body = ctx.state.passport;
});
```
####  配置参数说明：
- `provider`: - 服务提供商（必选）
  - 当前可选：qq、baidu、weibo、wechat
- `appId`: - 应用编号（必填）
- `appSecret`: - 应用秘钥（必填）
- `platform`: - 服务平台（选填）
- `redirect`: - 应用回调地址（选填）
- `scope`: - 申请的权限范围（选填）
- `state`: - 应用当前状态，可以指定任意值，服务提供商会原封不动地返回这个值（选填）

### Authentication Url
注意：不同的服务提供商之间，在认证时对回调地址的处理方式各不相同，如微信不会检查回调函数，微博和QQ只需核查回调函数的域名，而百度则需要核查包括Query参数在内的整个回调地址

l-passport支持两种方式设置回调函数

1.配置设置
```js
const passport = require('l-passport');

passport.initialize({
  provider: 'baidu'
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  redirect: 'your_app_redirect',
  state: 'your_app_state',
  scope: 'your_app_scope'
});

router.get('/login/baidu', passport.authorization('baidu'), async (ctx) => {
  ctx.body = ctx.state.passport;
});

```

2.动态设置

将redirect、state、scope放在路由的Query参数中，如/login/baidu?redirect=your_redirect&state=your_state&scope=your_scope

### 拓展登录策略
l-passport已经集成如下：
> * 1.qq：QQ登录
> * 2.baidu：百度登录
> * 3.weibo：微博登录
> * 4.wechat：微信登录

如果开发者觉得当前集成的登录策略无法满足需求时，可以自行拓展，其基本形式如下：
```js
class YourStragety {
  // 服务提供商提供的授权地址  
  getAuthorizeUrl(redirect, state, scope) {}

  // 用户通过授权后的认证过程
  authorize(code) {}
}

passport.use('your_stagety_name', YourStragety);
```

### 用户信息格式
认证完成后用户信息将挂载ctx.state.passport中，其基本格式如下：
```json
{
  "provider": "服务提供商",
  "uid"     : "用户编号",
  "nickname": "用户昵称",
  "avatar"  : "用户头像",
  "body"    : {}
}
```

