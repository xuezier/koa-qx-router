(function() {
    var $$ = require("../tools/_$.t");
    var ClientAuth = {
        name: new Date().getTime().toString(36),
        pass: new Buffer(Math.random() + "").toString("base64")
    };
    module.exports = {
        registerServer: function(url, auth, port, host, name, cb) {
            if (!url) {
                console.error("url must be like a uri");
                return;
            }
            if ((!auth) || auth.constructor != Object) {
                console.error("auth must be a json like {name:yourname,pass:yourpass}");
                return;
            };
            if ((!port) || !parseInt(port)) {
                console.error("port must be a Number or a NumberString");
                return;
            };
            var data = {
                name: name || ClientAuth.name,
                host: host || "127.0.0.1",
                port: port,
                auth: "Basic " + new Buffer(ClientAuth.name + ":" + ClientAuth.pass).toString("base64")
            };
            cb ? cb : cb = name || host;
            $$.request({
                url: url,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Basic " + new Buffer(auth.name + ":" + auth.pass).toString("base64")
                },
                body: JSON.stringify(data)
            }, function(err, response, body) {
                cb instanceof Function ? cb(err,response,body) : null
            });
        },
        auth: $$.koaAuth(ClientAuth),
    };
}());