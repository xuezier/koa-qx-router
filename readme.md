# koa-qx-router
[![NPM version][npm-image]][npm-url]

配合koa@v2使用的路由注册系统,Now , you can use the service !!!! please see the [readme.md](https://github.com/xuezier/koa-qx-router/blob/master/readme.md)

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
           Buddha bless    : :    Never BUGs


## Installation (via npm)
npm install koa-qx-router

or

npm install koa-qx-router --save

## Usage
### On Main Server
````javascript
const qx = require("koa-qx-router");
const qxServer = new qx.server();

qxServer.listen(mainPort, mainHostname, cb);
````

#### Install Auth
Install auth must be used. add an auth at least. An auth can only be used by one person to cerate client Service to connect the main service.
````javascript
qxServer.install({name1:pass1, name2:pass2 ...});
````

### On Client Server
create a app
````javascript
const koa = require("koa");
const app = new koa();
````
create a client service object
````javascript
const qx = require("koa-qx-router");
const qxClient = new qx.client({
    port: mainPort,             // 主路由的端口,default 1333
    hostname: mainHostname,     // 主路由的hostname,default 127.0.0.1
    auth:{
        name: auth_name,    // 注册主路由时的auth,作为验证,需要在主路由中先配置此项
        pass: auth_pass
    }
});
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
    strict          Boolean, false, set `Access-Control-Allow-Origin` cors model

#### Auth
````javascript
app.use(qxClient.auth({
    name: name,
    pass: pass
}));
````
if didnt set name and pass, qxClient will auto generate a name and pass.

#### BodyParser
````javascript
app.use(qxClient.bodyParser(options))
````
#####Options
Parse the request body. options is a json
    
    encoding    String, default `utf-8`
    multipart   Boolean, allow multipart data, default true,
    jsonLimit   String|Integer, The byte (if integer) limit of the JSON body, default 1mb
    formLimit   String|Integer, The byte (if integer) limit of the form body, default 56kb
    textLimit   String|Integer, The byte (if integer) limit of the text body, default 56kb
    patchNode   Boolean, Patch request body to Node's ctx.req, default false
    patchKoa    Boolean, Patch request body to Koa's ctx.request, default true


add koa-router
````javascript
const router = require("koa-router")();
router.all("/getname", function* (){
    this.body = "ok";
});

app.use(router.routes());
app.use(router.allowedMethods());
````

start client service
````javascript
app.listen(clientPort, qxClient.registerServer(app));
````
Now, defined a rest Api for http://127.0.0.1:clientPort/getname, access the api you can use curl like
````bash
curl http://mainHostname:mainPort/auth_name/getname
````





## Support
use the module must start least 2 service processes. 1 for Main service, others for client service processes.

Main service process is open to the outside world.

Client service processes is closed, not open to the outside world. 

Users only through the main service process to access client service processes.

## disclaimer
此模块是开发者自主兴趣开发和维护，不参与商业性运作，开发者具有最终解释权，如有任何疑问请在github上创建issue。

[npm-image]: https://img.shields.io/npm/v/koa-qx-router.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/koa-qx-router
