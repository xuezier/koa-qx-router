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
                        Object.keys(files).length ? (data.files = files, data.fileds = fields) : data = fields
                        resolve(data);
                    };
                });
            });
        },
        urlencoded2json: (urlencoded) => {
            urlencoded = urlencoded.replace(/&/g, "\",\"");
            urlencoded = urlencoded.replace(/=/g, "\":\"");
            urlencoded = "{\"" + urlencoded + "\"}";
            return urlencoded;
        },
        bytes: require('./bytes'),
        auth:require('./basic-auth')
    }
}());
