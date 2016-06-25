module.exports = {
    decodeAuth: (auth) => {
        if (!auth) {
            return;
        };
        var tmp = auth.split(' ');
        var buf = new Buffer(tmp[1], 'base64');
        var plain_auth = buf.toString('utf-8', 0);
        return plain_auth;
    },
    auth: (plain_auth) => {
        var _auth = 'Basic ';
        if (typeof plain_auth === 'string') {
            _auth += new Buffer(plain_auth).toString('base64');
        } else if (typeof plain_auth === 'object') {
            var str = '';
            for (var key in plain_auth) {
                str = `${key}:${plain_auth[key]}`;
            };
            _auth += new Buffer(str).toString('base64');
        } else {
            var error = new Error('first argument must a String like name:pass or a JSON like {name:pass}')
            console.error(error.stack);
            process.exit();
            return;
        }
        return _auth;
    }
}