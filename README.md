# cordova-universaldeeplink-plugin

A Cordova plugin that enables deep linking support for Android and Universal Links for iOS, allowing your app to handle incoming links based on defined URLs.

## Installation

To add this plugin to your Cordova project, run:

```bash
cordova plugin add https://github.com/os-adv-dev/cordova-universaldeeplink-plugin.git
```

## Usage

### Step 1: Configure applinks.json

Inside your Cordova app, create a file named `applinks.json` in the `www` folder to define the URLs that your app will respond to. This file should contain a JSON array with each URL you want to enable for deep linking.

Example `applinks.json` file:

```json
{
    "applinks": ["https://exampletest.com", "https://qualquercoisa.com"]
}
```

> **Note:** The URLs in this file are used to dynamically configure the intent filters for Android and Universal Links for iOS.

### Step 2: Build the App

After adding the plugin and configuring the `applinks.json` file, build your Cordova project to apply the configurations:

```bash
cordova build
```

### Step 3: Testing Deep Links

1. **Android**: When users open one of the specified URLs, the app will automatically handle it as a deep link.
2. **iOS**: For Universal Links, ensure that the Apple App Site Association file is set up on the server hosting the URLs.

### Features

- **Dynamic Configuration**: Configure URLs in `applinks.json`, and the plugin will dynamically update the `AndroidManifest.xml` and iOS configurations.
- **Deep Linking**: Support for Android intent filters to handle deep links.
- **Universal Links**: Support for iOS Universal Links, allowing the app to open directly from defined URLs.

### Example applinks.json Configuration

Below is an example of the `applinks.json` file format:

```json
{
    "applinks": [
        "https://dev.exampletest.com",
        "https://qa.exampletest.com"
    ]
}
```

---

After following these steps, your Cordova app will be ready to handle the specified URLs on both Android and iOS.