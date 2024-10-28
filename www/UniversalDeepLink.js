var exec = require('cordova/exec');

exports.registerLink = function (arg0, success, error) {
    exec(success, error, 'UniversalDeepLink', 'registerLink', [arg0]);
};
