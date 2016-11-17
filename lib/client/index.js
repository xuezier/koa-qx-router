(function() {
  'use strict';
  var net = require('net');
  var stream = require('stream');
  var http = require('http');
  var child_process = require('child_process');

  var handleSocket_1 = require('../handleSocket');
  var $$ = require('../tools/_$.t');

  // define class qxClient
  class qxClient {
    constructor(options, cb) {
      let self = this;
      self.name = qxClient;
      self.ClientAuth = {
        name: new Date().getTime().toString(36),
        pass: new Buffer(Math.random() + '').toString('base64')
      };
      self.ReqMap = new Map();
      self.defaultCorsOptions = {
        allowMethods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: false,
        origin: ['*']
      };
      typeof(options) == 'object' ? self.options = options: console.error('arguments[0] must a json');
      // Execute callback function
      cb instanceof Function ? cb(self) : null;
    }

    auth(auth) {
      let self = this;
      let _auth = self.ClientAuth;
      if (typeof(auth) === 'object') {
        auth.name ? _auth.name = auth.name : false;
        auth.pass ? _auth.pass = auth.pass : false;
      }
      self.ClientAuth = _auth;
      return function*(next) {
        var header = this.headers['authorization'];
        // console.log(this.headers)
        var authorization = $$.auth.decodeAuth(header);
        if (`${_auth.name}:${_auth.pass}` === authorization) {
          yield next;
        } else {
          this.status = 401;
          this.body = 'can no auth';
          // this.throw(401);
        }
      };
    }
    registerServer(app) {
      var registerBefore = (typeof(app) === 'object');
      if (!registerBefore) return console.error('first argument must application');

      let self = this;
      var options = self.options;

      return function() {
        var opts = {
          port: options.port || 1333,
          hostname: options.hostname || '127.0.0.1',
          path: options.hostname || '127.0.0.1' + ':' + options.port || 1333,
          auth: `${options.auth.name}:${options.auth.pass}`,
          method: 'CONNECT',
          Connection: 'Keep-Alive'
        };

        var req = http.request(opts);
        req.write('yes');
        req.on('connect', (res, socket, head) => {
          handleSocket_1.handleSocket(socket);
          // post a AUTH info to server
          socket.msgInfo('auth-init', self.ClientAuth);

          socket.onMsgInfo('auth-error', msg => {
            console.error(msg);
            socket.emit('close');
          });

          socket.onMsgInfo('route', msg => {
            // console.log('Msg:',msg);
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
            moni_res.on('finish', function() {
              var res_data = Buffer.concat(res_buffers).toString();
              socket.msgSuccess('route', {
                cb_id: info.req_id,
                data: res_data
              });
              moni_res.emit('end');
            });
            app.callback()(moni_req, moni_res);
          });
          socket.onMsgInfo('route-body', msg => {
            var info = msg.info;
            var req_id = info.req_id;

            if (req_id && self.ReqMap.has(req_id)) {
              self.ReqMap.get(req_id).push(info.data);
            } else {
              self.ReqMap.set(req_id, info);
              console.log('WRONG req_id2', info);
            }
          });
          socket.onMsgInfo('route-body-end', msg => {
            var info = msg.info;
            var req_id = info.req_id;
            if (req_id && self.ReqMap.has(req_id)) {
              self.ReqMap.delete(req_id);
              // self.ReqMap.get(req_id).push(null);
            } else {
              console.error('WRONG req_id1');
            }
          });
          socket.on('close', function() {
            console.log('socket close!!!');
            self.processRestart();
          });
        });
      };
    }

    processRestart() {
      // restart process is depended on pm2，
      // please use pm2 to start the process，when process is exited by itself，
      // pm2 will restart the process auto
      var fs = require('fs');
      var file_name = 'qxError/socket_error_' + new Date().toLocaleDateString().replace(' ', '_') + '.log';
      try {
        fs.readdirSync('qxError');
      } catch (e) {
        fs.mkdirSync('qxError', 2);
      }
      var tempString = '\n' + new Date().toLocaleString() + '  ::=>  socket err,process be stopped \n';
      fs.appendFileSync(file_name, tempString, {
        encoding: 'utf-8'
      });
      process.exit();
    }

    cors(options) {
      let self = this;
      typeof(options) !== 'object' ? options = self.defaultCorsOptions: options;
      options.origin ? true : options.origin = [];
      return require('./cors.c')(self, options);
    }

    bodyParser(opts) {
      opts = opts || {};
      opts.patchNode = 'patchNode' in opts ? opts.patchNode : false;
      opts.patchKoa = 'patchKoa' in opts ? opts.patchKoa : true;
      opts.multipart = 'multipart' in opts ? opts.multipart : true;
      opts.encoding = 'encoding' in opts ? opts.encoding : 'utf-8';
      opts.jsonLimit = 'jsonLimit' in opts ? opts.jsonLimit : '1mb';
      opts.formLimit = 'formLimit' in opts ? opts.formLimit : '56kb';
      opts.formidable = 'formidable' in opts ? opts.formidable : {};
      opts.textLimit = 'textLimit' in opts ? opts.textLimit : '56kb';
      opts.limit = 'limit' in opts ? opts.limit : '56kb';
      opts.strict = 'strict' in opts ? opts.strict : true;

      opts.jsonLimit = $$.bytes.parse(opts.jsonLimit);
      opts.formLimit = $$.bytes.parse(opts.formLimit);
      opts.textLimit = $$.bytes.parse(opts.textLimit);
      opts.limit = $$.bytes.parse(opts.limit);

      return function*(next) {
        let self = this;
        var req = self.req;
        var method = self.method.toUpperCase();
        var body = {};
        if (!opts.strict || ['GET', 'HEAD'].indexOf(method) === -1) {
          if (opts.multipart && self.is('multipart')) {
            body = yield $$.parseRequest(req);
          } else {
            body = yield new Promise(function(resolve, reject) {
              var str = '';
              req.on('data', chunk => {
                var len = false;
                if (chunk) {
                  str += chunk || '';
                } else {
                  len = chunk.length;
                  str.indexOf('+') > -1 ? str = str.replace(/\+/g, '%20') : false; // urlencode will replace ' ' to '+'
                  if (self.is('text')) {
                    len > (opts.textLimit || opts.limit) ? resolve('') : resolve(decodeURIComponent(str));
                  } else if (self.is('json')) {
                    len > (opts.jsonLimit || opts.limit) ? resolve('') : resolve(JSON.parse(decodeURIComponent(str)));
                  } else if (self.is('urlencoded')) {
                    len > (opts.formLimit || opts.limit) ? resolve('') : str = decodeURIComponent(str);
                    resolve($$.urlencode2json.decode(str, true));
                  };
                }
              });
            });
          };
          opts.patchNode ? self.req.body = body : false;
          opts.patchKoa ? self.request.body = body : false;
        }
        yield next;
      };
    }
  }
  // export class
  module.exports = qxClient;
}());
