# koa-qx-router
[![NPM version][npm-image]][npm-url]
配合koa@v2使用的路由注册系统,Now , you can use the service !!!! please see the readme.md

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
### On Main Server
````javascript
const qx = require("koa-qx-router");
const qxServer = =new qx.server();

qxServer.listen(port, hostname, cb);
````
### On Client Server
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

#### Origin Cors
````javascript
app.use(qxClient.cors(options));
````
##### Options
Configures the Access-Control-Allow-Origin CORS header.
Options is a json.

    origin          Array, default [*], set `Access-Control-Allow-Origin`
    credentials     Boolean, default false, set `Access-Control-Allow-Credentials`
    allowMethods    String, default 'GET,HEAD,PUT,POST,DELETE', set `Access-Control-Allow-Methods`


#### Auth
````javascript
app.use(qxClient.auth({
    name: name,
    pass: pass
}));
````
if dont set name and pass, qxClient will auto generate a name and pass.


#### BodyParser
````javascript
app.use(qxClient.bodyParser(options))
````
#####Options
Parse the request body. optins is a json
    
    encoding    String, default `utf-8`
    multipart   Boolean, allow multipart data, default true,
    jsonLimit   String|Integer, The byte (if integer) limit of the JSON body, default 1mb
    formLimit   String|Integer, The byte (if integer) limit of the form body, default 56kb
    textLimit   String|Integer, The byte (if integer) limit of the text body, default 56kb
    patchNode   Boolean, Patch request body to Node's ctx.req, default false
    patchKoa    Boolean, Patch request body to Koa's ctx.request, default true

## Support
use the module must start least 2 service processes. 1 for Main service, others for client service processes.

Main service process is open to the outside world.

Client service processes is closed, not open to the outside world. 

Users only through the main service process to access client service processes.



[npm-image]: https://img.shields.io/npm/v/koa-qx-router.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/koa-qx-router
