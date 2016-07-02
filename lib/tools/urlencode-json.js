module.exports = {
    encode: (json, isendoce) => {
        if (typeof json == 'object') {
            var arr = new Array;
            for (var key in json) {
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
        if (typeof str == 'string') {
            var arr = str.split('&');
            var json = {};
            for (var index in arr) {
                var temp = arr[index].split('=');
                json[temp[0]] = isdecode ? decodeURIComponent(temp[1]) : temp[1];
            }
            return json;
        } else {
            var err = new Error('first argument must a urlencode string');
            console.err(err.stack);
        }
    }
}