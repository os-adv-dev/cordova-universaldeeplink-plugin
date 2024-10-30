var exec = require('cordova/exec');

exports.setUniversalLinkCallback = function (success, error) {
    exec(success, error, 'UniversalDeepLink', 'setUniversalLinkCallback');
};
