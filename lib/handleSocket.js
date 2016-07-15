"use strict";
const ChunkHandle_1 = require("./ChunkHandle");
const When_1 = require("./When");
const msg_1 = require("./msg");

function runGEN(generatorFunction) {
    var generatorItr = generatorFunction(resume);
    var _is_running;

    function resume(callbackValue) {
        if (_is_running) {
            process.nextTick(resume); // 放到异步队列中，让caller把函数全部执行完，去执行_is_running = false
        } else {
            _is_running = true;
            generatorItr.next(callbackValue);
            _is_running = false;
        }
    }
    _is_running = true;
    generatorItr.next();
    _is_running = false;
};

function handleSocket(socket, options) {
    "use strict";
    var chuck_handle = new ChunkHandle_1.default(socket);
    // init
    chuck_handle.run = chuck_handle.get_content_length;
    // Keep socket connecting
    socket.setKeepAlive(true);
    socket.setTimeout(0);
    // listening receive data
    socket.on("data", function(chunk) {
        chuck_handle.run(chunk);
    });
    // encapsulation post function
    socket.msg = function(data, cb) {
        var buffer = new Buffer(JSON.stringify(data));
        socket.write(buffer.length.toString());
        socket.write('\0');
        socket.write(buffer, cb);
    };
    // encapsulation difference state machine's message
    // trigger
    var GEN_emit = function(eventName, data, resume) {
        var len = socket.listeners(eventName).length;
        if (len) {
            var w = new When_1.default(len, resume);
            var i = 0;
            socket.emit(eventName, data, function() {
                w.ok(i++);
            });
        } else {
            resume();
        }
    };
    socket.on("msg", function(data) {
        if (data && data.type && data.info) {
            var config = exports.config || {};
            var hiddenFlags = config.hiddenFlags;
            runGEN(function*(resume) {
                yield GEN_emit("msg:" + data.type, data, resume);
                if (data.from) {
                    yield GEN_emit("msg:" + data.type + ":" + data.from, data, resume);
                };
            });
        }
    });
    // error handling
    socket.on("error", function(e) {
        console.log("TCP ERROR", socket._id, e);
        socket.emit("close");
    });
    // encapsulation `msg` Event
    msg_1.msgHandle(socket);
    return socket;
}
exports.handleSocket = handleSocket;;
