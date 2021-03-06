(function() {
  'use strict';

  let net = require('net');
  let http = require('http');
  let url = require('url');

  let handleSocket_1 = require('../handleSocket');
  let $$ = require('../tools/_$.t');

  let ip_re = /^([0-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.([0-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.([0-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.([0-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])$/;

  // define class qxServer
  class qxServer {
    constructor() {
      let self = this;
      self.clients = new Map();
      self.ResMap = new Map();
      self.AuthMap = new Map();
      self.proxy = http.createServer();
    };
    // add auths
    install(auths) {
      let self = this;
      if (typeof auths !== 'object') return console.error('first argument must a json like {name1:pass1,name2:pass2...}');

      for (let key in auths) {
        self.AuthMap.set(`${key}:${auths[key]}`, false);
      };
    };
    // listen a server , cb(http.createServer());
    listen(port, host, cb) {
      let self = this;

      host ? cb ? true :
        typeof(host) == 'string' ? true :
        typeof(host) == 'function' ? cb = host :
        false :
        host = '127.0.0.1';
      if (!ip_re.test(host)) return console.error('host must like 127.0.0.1');

      // start server
      self.proxy.listen(port, host);
      console.log('Service started at ' + host + ':' + port);
      // run callback
      typeof(cb) === 'function' ? cb(self.proxy): null;

      // add proxy listener
      self.proxy.on('connect', (req, socket, head) => {
        socket.write('HTTP/1.1 200 Connection Established\r\n' +
          'Proxy-agent: Node.js-Proxy\r\n' +
          '\r\n');
        // let srvurl = url.parse(`http://${req.url}`);
        let plain_auth = $$.auth.decodeAuth(req.headers['authorization']);
        let _user = plain_auth.split(':');
        let user = {
          name: _user[0],
          pass: _user[1]
        };

        handleSocket_1.handleSocket(socket);

        if (self.AuthMap.has(plain_auth)) {
          if (self.AuthMap.get(plain_auth)) {
            // if some one has used this auth, stop register server
            socket.msgInfo('auth-error', 'auth has used!!!socket error,client can not connect');
            console.error('this auth is used');
            // socket.emit('close');
          };
          self.AuthMap.set(plain_auth, true);
          /**response router callback */
          socket.onMsgSuccess('route', function(data) {
            let res = data.info;
            if (res.cb_id) {
              if (self.ResMap.has(res.cb_id)) {
                let response = self.ResMap.get(res.cb_id);
                response.socket.end(res.data);
                // response.end();
                self.ResMap.delete(res.cb_id);
              } else {
                console.error('UNREGISTER RESPONED ID');
              }
            } else {
              console.error('NONE RESPONED ID');
            }
          });
          socket.onMsg('auth-init', function(msg) {
            let info = msg.info;
            socket._auth = info;
          });
          socket.on('timeout', function() {
            console.log('socket timeout');
            socket.emit('close');
          });

          socket.on('close', function() {
            console.log('socket closed');
            self.AuthMap.set(plain_auth, false);
            self.clients.delete(user.name);
          });
          self.clients.set(user.name, socket);
        } else {
          console.log('ERROR AUTH');
          socket.msgInfo('auth-error', 'auth is not allowed in main service, client server connect error')
          socket.emit('close');
        };
      });

      self.proxy.on('request', function(request, response) {
        let urls = request.url.split('/');
        let name = urls[1];
        if (self.clients.has(name)) {
          let socket = self.clients.get(name);
          let _auth = socket._auth;
          // console.log('socket_auth', socket._auth)
          if (!_auth) {
            response.statusCode = 401;
            response.end();
            return;
          };
          let req_id = (+new Date).toString(36) + Math.random().toString(36).substr(2);
          request.url = request.url.substr(name.length + 1);
          socket.msgInfo('route', {
            req_id: req_id,
            data: {
              httpVersionMajor: request.httpVersionMajor,
              httpVersionMinor: request.httpVersionMinor,
              httpVersion: request.httpVersion,
              complete: request.complete,
              headers: Object.assign(request.headers, {
                authorization: 'Basic ' + new Buffer(_auth.name + ':' + _auth.pass).toString('base64'),
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
          request.on('readable', () => {
            let chunk = request.read() || null;
            socket.msgInfo('route-body', {
              req_id: req_id,
              data: chunk
            });
          });
          // request.on('data', function(chunk) {
          //     console.log('chunk',chunk)

          // });

          request.on('end', function*() {
            socket.msgInfo('route-body-end', {
              req_id: req_id
            });
            // self.ResMap.delete(req_id);
          });
          self.ResMap.set(req_id, response);
        } else {
          response.end('No Found Auth');
        };
      });
    };
  };

  module.exports = qxServer;
}());
