(function() {
  var formidable = require("formidable");
  var form = new formidable.IncomingForm();
  module.exports = {
    parseRequest: function(request) {
      return new Promise(function(resolve, reject) {
        form.parse(request, function(err, fields, files) {
          if (err) {
            reject(err);
          } else {
            var data = {};
            Object.keys(files).length ? (data.files = files, data.fileds = fields) : (data = fields);
            resolve(data);
          };
        });
      });
    },
    urlencode2json: require('./urlencode-json'),
    bytes: require('./bytes'),
    auth: require('./basic-auth')
  };
}());
