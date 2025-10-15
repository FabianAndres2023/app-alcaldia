
  cordova.define('cordova/plugin_list', function(require, exports, module) {
    module.exports = [
      {
          "id": "cordova-plugin-background-fetch.BackgroundFetch",
          "file": "plugins/cordova-plugin-background-fetch/www/BackgroundFetch.js",
          "pluginId": "cordova-plugin-background-fetch",
        "clobbers": [
          "window.BackgroundFetch"
        ]
        }
    ];
    module.exports.metadata =
    // TOP OF METADATA
    {
      "cordova-plugin-background-fetch": "7.2.4"
    };
    // BOTTOM OF METADATA
    });
    