'use strict';
class ChunkHandle {
  constructor(event) {
    this._content_length = 0;
    this._buffer_cache = [];
    this._events = event;
  }
  run(chunk) {}
  get_content_length(chunk) {
    // content_length \0 content
    // 可能会因为\0而导致数据包分开来导入
    // 如果是，那么就要有一步进行拼接
    // 如果拼接过还有问题的话，就要报错了
    if(this._buffer_cache.length) {
      this._buffer_cache.push(chunk);
      chunk = Buffer.concat(this._buffer_cache);
      var _is_use_concat = true;
      this._buffer_cache = [];
    }
    // [0, 1, \0, a, b] 5 - 2 - 1
    var _split_index = chunk.indexOf('\0');
    if(_split_index > 0) {
      var _content_length_buffer = chunk.slice(0, _split_index);
      this._content_length = parseInt(_content_length_buffer);
    }
    if(!this._content_length) {
      if(_is_use_concat) {
        console.error('错误的数据块', chunk.toString(), (new Error).stack);
      } else {
        // 可能是数据块不完整
        // 先存入缓存中
        this._buffer_cache.push(chunk);
      }
      return;
    }
    this.run = this.concat_content;
    var _remain_buffer = chunk.slice(_split_index + 1); //排除掉\0字符
    // 考虑到content-length \0 后面就没东西了，就没必要解析了
    _remain_buffer.length && this.run(_remain_buffer);
  }
  concat_content(chunk) {
    var _chunk_length = chunk.length;
    if(_chunk_length <= this._content_length) {
      this._buffer_cache.push(chunk);
      this._content_length -= _chunk_length;
      if(this._content_length === 0) {
        this.parse_content();
      }
    } else {
      var _current_buffer = chunk.slice(0, this._content_length);
      var _remain_buffer = chunk.slice(this._content_length);
      //当下的所需的数据块切出，进入解析器
      this._buffer_cache.push(_current_buffer);
      this._content_length = 0;
      this.parse_content();
      //剩余的包重新进入下一轮的解析
      this.get_content_length(_remain_buffer);
    }
  }
  parse_content() {
    this.run = this.get_content_length;
    try {
      var _result_str = Buffer.concat(this._buffer_cache);
      var result = JSON.parse(_result_str + '', (key, value) => {
        return value && value.type === 'Buffer' && (Array.isArray(value.data) || typeof value.data === 'string') ? new Buffer(value.data) : value;
      });
      this._buffer_cache = [];
    } catch(e) {
      console.error('数据解析出错', e.stack, this._buffer_cache, _result_str.toString());
      this._buffer_cache = [];
      return;
    }
    this._events.emit('msg', result, _result_str);
  }
}
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = ChunkHandle;
