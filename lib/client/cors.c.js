module.exports = function (obj, options) {
    return function* (next) {
        var can_next = false;
        var _origin = (this.header.origin || '*') + '';
        var arr = [];
        // console.log(_origin)
        options.strict ? arr = options.origin.filter(function (item) {
            return item == _origin;
        }) :
            arr = options.origin.filter(function (item) {
                return (_origin.indexOf(item) > -1);
            });
        // console.log(arr)
        can_next = arr.length;
        this.set('Access-Control-Allow-Origin', _origin);
        this.set('Access-Control-Allow-Credentials', options.credentials || _origin == '*' ? false : true);
        this.set('Access-Control-Allow-Methods', options.allowMethods || obj.defaultCorsOptions.allowMethods);
        return can_next ? yield next : (console.log('No Allowed Origin'), this.status = 403);
    };
}