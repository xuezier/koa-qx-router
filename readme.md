# koa-qx-router
    配合koa@v2使用的路由注册系统
                         _oo0oo_
                        088888880
                        88" . "88
                        (| -_- |)
                         0\ = /0
                      ___/'---'\___
                    .' \\|     |// '.
                   / \\|||  :  |||// \
                  /_ ||||| -:- |||||- \
                 |   | \\\  -  /// |   |
                 | \_|  ''\---/''  |_/ |
                 \  .-\__  '-'  __/-.  /
               ___'. .'  /--.--\  '. .'___
            ."" '<  '.___\_<|>_/___.' >'  "".
           | | : '-  \'.;'\ _ /';.'/ - ' : | |
           \  \ '_.   \_ __\ /__ _/   .-' /  /
       ====='-.____'.___ \_____/___.-'____.-'=====
                         '=---='
                      
     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
               佛祖保佑    : :    永无BUG


## Installation (via npm)
npm install koa-qx-router

## Usage
````javascript
const koa = require("koa");
const app = new koa();

const qx = require("koa-qx-router");
const qxClient = new qx.client({
    port: port,             // 主路由的端口,default 1333
    hostname: hostname,     // 主路由的hostname,default 127.0.0.1
    auth:{
        name: auth_name,    // 注册主路由时的auth,作为验证,需要在主路由中先配置此项
        pass: auth_pass
    }
});

const router = require("koa-router")();
router.all("/", function* (){
    this.body = "ok";
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(clientPort, qxClient.registerServer(app));
````

## Origin Cros
````javascript
app.use(qxClient.cros(options));
````
### Options
Configures the Access-Control-Allow-Origin CORS header.
Options is a json.

    origin          Array, default [*], set `Access-Control-Allow-Origin`
    credentials     Boolean, default false, set `Access-Control-Allow-Credentials`
    allowMethods    String, default 'GET,HEAD,PUT,POST,DELETE', set `Access-Control-Allow-Methods`


## auth
````javascript
app.use(qxClient.auth({
    name: name,
    pass: pass
}));
````
if dont set name and pass, qxClient will auto generate a name and pass.