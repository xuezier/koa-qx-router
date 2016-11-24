'use strice';

let express = require('express');

let http = require('http');

const app = express();

let qx = require('../index');
const qxClient = new qx.client({
  port: 1333,
  hostname: '127.0.0.1',
  auth: {
    name: 'xuezi',
    pass: '123456'
  }
});

app.get('/test', function(req, res) {
  res.end('123');
});

let register = qxClient.registerServer(app);

const server = http.createServer(app);

server.listen(1334, register);

console.log('client service started at 1334');
