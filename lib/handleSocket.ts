
import ChunkHandle from "./ChunkHandle";
import When from "./When";
import {msgHandle} from "./msg";

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

export function handleSocket(socket, options?: any) {
	"use strict";
	var chuck_handle = new ChunkHandle(socket);
	//初始化
	chuck_handle.run = chuck_handle.get_content_length;
	// 保持socket连接
	socket.setKeepAlive(true);
	socket.setTimeout(0);
	//监听数据接收
	socket.on("data", function (chunk) {
		chuck_handle.run(chunk);
	});
	//封装发送的函数
	socket.msg = function (data, cb) {
		var buffer = new Buffer(JSON.stringify(data));
		socket.write(buffer.length.toString());
		socket.write('\0');
		socket.write(buffer, cb);
	};
	//封装不同状态机的讯息
	//触发器
	var GEN_emit = function (eventName, data, resume) {
		var len = socket.listeners(eventName).length;
		if (len) {
			var w = new When(len, resume);
			var i = 0;
			socket.emit(eventName, data, function () {
				w.ok(i++, []);
			});
		} else {
			resume();
		}
	};
	socket.on("msg", function (data) {
		if (data && data.type && data.info) {
			var config = exports.config || {};
			var hiddenFlags = config.hiddenFlags;
			runGEN(function* (resume) {
				yield GEN_emit("msg:" + data.type, data, resume);
				if (data.from) {
					yield GEN_emit("msg:" + data.type + ":" + data.from, data, resume);
				}
			});
		}
	});
	// 错误处理
	socket.on("error", function (e) {
		console.log("TCP ERROR", socket._id, e);
	});
	socket.on("close", function (e) {
		console.log("TCP CLOSE", socket._id);
	});

	// 封装msg事件
	msgHandle(socket);

	return socket;
};
