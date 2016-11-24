'use strict';

let qx = require('../index');

const qxServer = new qx.server();

qxServer.install({
  xuezi: 123456
});

console.log(qxServer);

qxServer.listen(1333, '127.0.0.1');
