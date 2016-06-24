(function() {
    "use strict";
    var net = require("net");
    var http = require("http");
    var url = require("url");
    var auth = require("basic-auth");
    var handleSocket_1 = require("../handleSocket");
    var $$ = require("../tools/_$.t");
    var ip_re = /^([0-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.([0-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.([0-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.([0-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])$/;
    // define class qxServer
    class qxServer {
        constructor() {
            let self = this;
            self.clients = new Map();
            self.ResMap = new Map();
            self.proxy = http.createServer();
        };
        // listen a server , cb(http.createServer());
        listen(port, host, cb) {
            let self = this;
            if (!(parseInt(port) > 0)) {
                console.error("first augument is post must be a Number");
                return;
            };
            host ? cb ? true :
                typeof(host) === "string" ? true :
                typeof(host) === "function" ? cb = host :
                false :
                host = "127.0.0.1";
            if (!ip_re.test(host)) {
                console.error("host must like 127.0.0.1");
                return;
            };
            // start server
            self.proxy.listen(port, host);
            console.log("Service started at " + host + ":" + port);
            // run callback
            typeof(cb) === "function" ? cb(self.proxy): null;

            // add proxy listener
            self.proxy.on("connect", (req, socket, head) => {
                socket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Node.js-Proxy\r\n' +
                    '\r\n');
                var srvurl = url.parse(`http://${req.url}`);
                var user = auth(req);
                if (user && user.name) {
                    socket.auth = user;
                    handleSocket_1.handleSocket(socket);
                    /**response router callback */
                    socket.onMsgSuccess("route", function(data) {
                        var res = data.info;
                        // console.log(data)
                        if (res.cb_id) {
                            if (self.ResMap.has(res.cb_id)) {
                                var response = self.ResMap.get(res.cb_id);
                                response.socket.write(res.data);
                                response.end();
                                self.ResMap.delete(res.cb_id);
                            } else {
                                console.error("UNREGISTER RESPONED ID");
                            }
                        } else {
                            console.error("NONE RESPONED ID");
                        }
                    });
                    socket.onMsg("auth-init", function(msg) {
                        var info = msg.info;
                        socket._auth = info;
                    });
                    socket.on("timeout", function() {
                        console.log("socket timeout");
                    });
                    socket.on("close", function() {
                        console.log("socket closed");
                        self.clients.delete(user.name);
                    });
                    self.clients.set(user.name, socket);
                } else {
                    console.log("ERROR AUTH");
                    socket.close();
                };
            });
            self.proxy.on("request", co.wrap(function*(request, response) {
                // var data = yield $$.parseRequest(request);
                // console.log(data)
                var urls = request.url.split("/");
                var name = urls[1];
                if (self.clients.has(name)) {
                    var socket = self.clients.get(name);
                    var _auth = socket._auth;
                    if (!_auth) {
                        response.statusCode = 401;
                        response.end();
                        return;
                    };
                    var req_id = (+new Date).toString(36) + Math.random().toString(36).substr(2);
                    request.url = request.url.substr(name.length + 1);
                    socket.msgInfo("route", {
                        req_id: req_id,
                        data: {
                            httpVersionMajor: request.httpVersionMajor,
                            httpVersionMinor: request.httpVersionMinor,
                            httpVersion: request.httpVersion,
                            complete: request.complete,
                            headers: Object.assign(request.headers, {
                                authorization: "Basic " + new Buffer(_auth.name + ":" + _auth.pass).toString("base64"),
                                // "content-type":"multipart/form-data"
                                // "content-type":"application/json"
                            }),
                            rawHeaders: request.rawHeaders,
                            trailers: request.trailers,
                            rawTrailers: request.rawTrailers,
                            readable: request.readable,
                            upgrade: request.upgrade,
                            url: request.url,
                            method: request.method,
                        }
                    });
                    request.on("data", function(chunk) {
                        socket.msgInfo("route-body", {
                            req_id: req_id,
                            data: chunk
                        });
                    });

                    request.on("end", function*() {
                        yield socket.msgInfo("route-body-end", {
                            req_id: req_id
                        });
                        // self.ResMap.delete(req_id);
                    })
                    self.ResMap.set(req_id, response);
                } else {
                    response.end("No Found Auth");
                };
            }));
        };
    };

    module.exports = qxServer;
}());
