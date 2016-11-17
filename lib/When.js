'use strict';

function noop() {}
class When {
  constructor(task_num, complete_cb) {
    this.task_num = null;
    this.complete_cb = null;
    this.complete_args = null;
    //创建一个密集数组
    this.task_num = Array.apply(null, { length: task_num });
    //所有子任务完成后的回调
    this.complete_cb = complete_cb instanceof Function ? complete_cb : noop;
    this.complete_args = [];
  };
  ok(task_id, arg) {
    delete this.task_num[task_id];
    this.complete_args[task_id] = arg;
    if (this.is_complete()) {
      this.complete_cb(this.complete_args);
    }
  };
  is_complete() {
    var _is_complete = true;
    //使用洗漱数组无法被遍历的特性，如果所有任务都被delete了，说明整个任务数组就是一个洗漱数组，some是无法遍历到任何对象的
    this.task_num.some(() => {
      _is_complete = false; //如果还有元素对象，则还没结束
      return true; //只执行一次
    });
    return _is_complete;
  };
  then(cb) {
    if (this.is_complete()) {
      cb(this.complete_args);
    } else {
      if (this.complete_cb === noop) {
        this.complete_cb = cb;
      } else {
        var before = this.complete_cb;
        this.complete_cb = function() {
          before.apply(this, arguments);
          cb.apply(this, arguments);
        };
      }
    }
  };
}
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = When;
