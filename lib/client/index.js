(function() {
    "use strict";
    var net = require("net");
    var stream = require("stream");
    var http = require("http");
    var handleSocket_1 = require("../handleSocket");
    var basic_auth = require("koa-basic-auth");
    var child_process = require("child_process");
    // define class qxClient
    class qxClient {
        constructor(options, cb) {
            let self = this;
            self.ClientAuth = {
                name: new Date().getTime().toString(36),
                pass: new Buffer(Math.random() + "").toString("base64")
            };
            self.ReqMap = new Map();
            self.defaultCrosOptions = {
                allowMethods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
                credentials: false,
                origin: ["*"]
            }
            typeof(options) == "object" ? self.options = options: console.error("arguments[0] must a json");
            // Execute callback function
            cb instanceof Function ? cb(self) : null;
        };
        auth(auth) {
            let _auth = this.ClientAuth;
            if (typeof(auth) === "object") {
                auth.name ? _auth.name = auth.name : false;
                auth.pass ? _auth.pass = auth.pass : false;
            };
            return basic_auth(_auth);
        };
        registerServer(app) {
            var registerBefore = (typeof(app) === "object");
            console.log(app)
            if (!registerBefore) {
                console.error("first argument must application");
                return;
            };
            let self = this;
            var options = self.options;
            return function() {
                var opts = {
                    port: options.port || 1333,
                    hostname: options.hostname || "127.0.0.1",
                    path: options.hostname || "127.0.0.1" + ":" + options.port || 1333,
                    auth: `${options.auth.name}:${options.auth.pass}`,
                    method: "CONNECT",
                    Connection: "Keep-Alive"
                };
                var req = http.request(opts);
                req.end()
                req.on('connect', (res, socket, head) => {
                    handleSocket_1.handleSocket(socket);
                    // post a AUTH info to server
                    socket.msgInfo("auth-init", self.ClientAuth);

                    socket.onMsgInfo("route", msg => {
                        // console.log("Msg:",msg);
                        var info = msg.info;
                        /**simulate request */
                        var req_reader = new stream.Readable();
                        var req_socket = new net.Socket({
                            // allowHalfOpen: true,
                            readable: true,
                            writable: true
                        });
                        var moni_req = new http.IncomingMessage(req_socket);
                        for (var k in info.data) {
                            moni_req[k] = info.data[k];
                        }
                        self.ReqMap.set(info.req_id, moni_req);
                        /**simulate response */
                        var res_socket = new stream.Writable();
                        var moni_res = new http.ServerResponse(moni_req);
                        moni_res.assignSocket(res_socket);
                        var res_buffers = [];
                        res_socket._write = function(chunk, enc, next) {
                            res_buffers.push(chunk);
                            next();
                        };
                        moni_res.on("finish", function() {
                            var res_data = Buffer.concat(res_buffers).toString();
                            socket.msgSuccess("route", {
                                cb_id: info.req_id,
                                data: res_data
                            });
                            self.ReqMap.delete(info.req_id);
                        });
                        app.callback()(moni_req, moni_res);
                    });
                    socket.onMsgInfo("route-body", msg => {
                        var info = msg.info;
                        var req_id = info.req_id;
                        if (req_id && self.ReqMap.has(req_id)) {
                            self.ReqMap.get(req_id).push(info.data);
                        } else {
                            self.ReqMap.set(req_id, info);
                            console.error("WRONG req_id2", info);
                        };
                    });
                    socket.onMsgInfo("route-body-end", msg => {
                        var info = msg.info;
                        var req_id = info.req_id;
                        if (req_id && self.ReqMap.has(req_id)) {
                            self.ReqMap.delete(req_id);
                            // self.ReqMap.get(req_id).push(null);
                        } else {
                            console.error("WRONG req_id1");
                        };
                    });
                    socket.on("close", function() {
                        console.log("socket close!!!");
                        self.processRestart();
                    });
                });
            };
        };
        processRestart() {
            // restart process depend on pm2，
            // please use pm2 start the process，when process exit itself，
            // pm2 will restart the process auto
            process.exit();
        };
        cors(options) {
            let self = this;
            typeof(options) !== "object" ? options = self.defaultCrosOptions: options;
            return function*(next) {
                var can_next = false;
                var _origin = this.header.origin || "*" + "";
                for (var key in options.origin) {
                    if (_origin.indexOf(options.origin[key] || "") > -1) {
                        can_next = true;
                        break;
                    } else {
                        continue;
                    };
                };
                this.set("Access-Control-Allow-Origin", _origin);
                this.set("Access-Control-Allow-Credentials", options.credentials || _origin == "*" ? false : true);
                this.set("Access-Control-Allow-Methods", options.allowMethods || self.defaultCrosOptions.allowMethods);
                return can_next ? yield next : console.log("No Allowed Origin");
            };
        }
    };
    // export class
    module.exports = qxClient;
}());