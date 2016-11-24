'use strict';
const slice = Array.prototype.slice;

function msgHandle(socket) {
  //INFO
  socket.msgInfo = function(type, extend_info) {
    socket.msg({
      type: type,
      info: extend_info
    });
  };
  socket.onMsg = socket.onMsgInfo = function(type) {
    var args = slice.call(arguments);
    args[0] = 'msg:' + type;
    socket.on.apply(socket, args);
  };
  //ERROR
  socket.msgError = function(type, extend_info, errorMsg) {
    socket.msg({
      type: 'error',
      from: type,
      msg: errorMsg,
      info: extend_info
    });
  };
  socket.onMsgError = function(type) {
    var args = slice.call(arguments);
    args[0] = 'msg:error:' + type;
    socket.on.apply(socket, args);
  };
  //SUCCESS
  socket.msgSuccess = function(type, extend_info, successMsg) {
    socket.msg({
      type: 'success',
      from: type,
      msg: successMsg,
      info: extend_info
    });
  };
  socket.onMsgSuccess = function(type) {
    var args = slice.call(arguments);
    args[0] = 'msg:success:' + type;
    socket.on.apply(socket, args);
  };
}
exports.msgHandle = msgHandle;;
