module.exports = function(obj, options) {
  return function(req, res, next) {
    var can_next = false;
    var _origin = (req.headers.origin || '*') + '';
    var arr = [];
    // console.log(_origin)
    options.strict ? (arr = options.origin.filter(function(item) {
      return item == _origin;
    })) : (arr = options.origin.filter(function(item) {
      return(_origin.indexOf(item) > -1);
    }));
    // console.log(arr)
    can_next = arr.length;
    res.setHeaders('Access-Control-Allow-Origin', _origin);
    res.setHeaders('Access-Control-Allow-Credentials', options.credentials || _origin == '*' ? false : true);
    res.setHeaders('Access-Control-Allow-Methods', options.allowMethods || obj.defaultCorsOptions.allowMethods);
    return can_next ? next() : (console.log('No Allowed Origin'), res.status(403).end('auth canz'));
  };
};
