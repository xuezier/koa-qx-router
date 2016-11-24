module.exports = {
  encode: (json, isendoce) => {
    if(typeof json == 'object') {
      var arr = new Array;
      for(var key in json) {
        arr.push(key + '=' + (isendoce ? encodeURIComponent(json[key]) : json[key]));
      }
      var str = arr.join('&');
      return str;
    } else {
      var err = new Error('first argument must a json');
      console.err(err.stack);
    }
  },
  decode: (str, isdecode) => {
    if(typeof str == 'string') {
      isdecode ? str = decodeURIComponent(str) : str;
      var arr = str.split('&');
      var json = {};
      for(var i in arr) {
        if(typeof arr[i] == 'string') {
          var temp = arr[i];
          var index = temp.indexOf('=');
          json[temp.substr(0, index)] = temp.substr(index + 1);
        }
      }
      return json;
    } else {
      var err = new Error('first argument must a urlencode string');
      console.err(err.stack);
    }
  }
};
