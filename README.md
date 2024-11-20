# cordova-universaldeeplink-plugin

A Cordova plugin for enabling deep linking support on Android and Universal Links on iOS, allowing your app to handle incoming URLs based on predefined configurations.

## Installation

To add this plugin to your Cordova project, run:

```bash
cordova plugin add https://github.com/os-adv-dev/cordova-universaldeeplink-plugin.git --variable com.app.dev="https://exampletest.com", --variable com.app.prod="https://exampletestproduction.com
```

## Usage

### Step 1: Variables in the Plugin's Extensibility Configuration

Plugin's Extensibility configurations:

```json
{
    "plugin": {
        "url": "https://github.com/os-adv-dev/cordova-universaldeeplink-plugin.git",
        "variables": [
            {
                "name": "com.app.dev",
                "value": "https://exampletest.com,https://exampletestedev.com" 
            },
            {
                "name": "ccom.app.prod",
                "value": "https://exampletestproduction.com"
            }
        ]
    }
}
```

> **Note:** The URLs in this file are used to dynamically configure the intent filters for Android and Universal Links for iOS.

### Step 3: Testing Deep Links

1. **Android**: When users open one of the specified URLs, the app will automatically handle it as a deep link.
2. **iOS**: For Universal Links, ensure that the Apple App Site Association file is set up on the server hosting the URLs.

### Features
- **Dynamic Configuration**: Configure URLs as variables for each environment, and the plugin will dynamically apply them to the Android and iOS configurations.
- **Deep Linking**: Support for Android intent filters to handle deep links.
- **Universal Links**: Support for iOS Universal Links, allowing the app to open directly from defined URLs.


> **Note:** Additional configuration that should be done in server side to Android & iOS
- (Android) https://developer.android.com/training/app-links/verify-android-applinks#web-assoc
- (iOS) https://developer.apple.com/documentation/xcode/supporting-associated-domains

On Android, when you click a link, your app opens "on top" of the previous app where the link was clicked. To change this behavior, follow the instructions in this link and set the launch mode to `singleTask`:
https://www.outsystems.com/forums/discussion/87554/mobile-app-deeplink-doesnt-opening-the-app-externally/


---

After following these steps, your Cordova app will be ready to handle the specified URLs on both Android and iOS.