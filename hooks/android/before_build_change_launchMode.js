const fs = require('fs');
const path = require('path');

module.exports = function (context) {
    const platformRoot = path.join(context.opts.projectRoot, 'platforms/android');
    const manifestFile = path.join(platformRoot, 'app/src/main/AndroidManifest.xml');

    console.log("🔍 -----  Checking for AndroidManifest.xml to update launchMode...");
    if (!fs.existsSync(manifestFile)) {
        console.error(`❌ AndroidManifest.xml not found: ${manifestFile}`);
        return Promise.reject(`AndroidManifest.xml not found: ${manifestFile}`);
    }

    return new Promise((resolve, reject) => {
        let manifestContent = fs.readFileSync(manifestFile, 'utf-8');

        const launchModeRegex = /(<activity[^>]*android:name="[^"]*MainActivity"[^>]*android:launchMode=")[^"]*(")/;
        manifestContent = manifestContent.replace(launchModeRegex, `$1singleTask$2`);

        fs.writeFileSync(manifestFile, manifestContent, 'utf-8');
        console.log("✅ AndroidManifest.xml updated with singleTask launchMode in MainActivity! 🚀");
        resolve();
    });
};