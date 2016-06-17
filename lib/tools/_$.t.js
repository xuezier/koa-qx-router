(function() {
    module.exports = {
        koaAuth: require("koa-basic-auth"),
        request: require("co-request"),
        json2urlEncoded:require("form-urlencoded")
    }
}());