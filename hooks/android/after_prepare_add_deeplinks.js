const fs = require('fs');
const path = require('path');
const et = require('elementtree');

module.exports = function (context) {
    const platformRoot = path.join(context.opts.projectRoot, 'platforms/android');
    const manifestFile = path.join(platformRoot, 'app/src/main/AndroidManifest.xml');
    const applinksFile = path.join(context.opts.projectRoot, 'applinks.json');

    // Function to retrieve the App ID from config.xml
    function getAppId(context) {
        const configXmlPath = path.join(context.opts.projectRoot, 'config.xml');
        if (!fs.existsSync(configXmlPath)) {
            console.error(`-- ❌ -- Error: config.xml not found at path: ${configXmlPath}`);
            return null;
        }

        const configXmlContent = fs.readFileSync(configXmlPath).toString();
        const etree = et.parse(configXmlContent);
        const appId = etree.getroot().attrib.id;

        console.log(`---- 📱 --- App ID found: ${appId}`);
        return appId;
    }

    // Function to retrieve applinks for the given app ID from applinks.json
    function getApplinksForAppId(appId) {
        if (!fs.existsSync(applinksFile)) {
            console.error(`-- ❌ -- Error: applinks.json not found at path: ${applinksFile}`);
            return [];
        }

        const applinksData = JSON.parse(fs.readFileSync(applinksFile, 'utf-8'));

        // Check if the appId exists in applinks.json
        if (!applinksData[appId]) {
            console.error(`-- ❌ -- No applinks found for App ID: ${appId} in applinks.json`);
            return [];
        }

        // Split the URLs by comma and trim each URL
        const applinksArray = applinksData[appId].split(',').map(link => link.trim());
        console.log(`--- ✅ -- Applinks for App ID "${appId}": ${applinksArray}`);

        return applinksArray;
    }

    const appId = getAppId(context);
    if (!appId) {
        console.error("--- ❌ Error: Could not determine App ID from config.xml.");
        return Promise.reject("--- ❌ Could not determine App ID.");
    }

    const applinks = getApplinksForAppId(appId);
    if (applinks.length === 0) {
        console.warn("--- ❌ Warning: No applinks found for the current App ID.");
        return Promise.reject("--- ❌ No applinks found for the current App ID.");
    }

    console.log("🔍 Checking for AndroidManifest.xml...");
    if (!fs.existsSync(manifestFile)) {
        console.error(`❌ AndroidManifest.xml not found: ${manifestFile}`);
        return Promise.reject(`AndroidManifest.xml not found: ${manifestFile}`);
    }

    return new Promise((resolve, reject) => {
        console.log("✅ AndroidManifest.xml found. Modifying intent filters...");
        let manifestContent = fs.readFileSync(manifestFile, 'utf-8');

        // Extract unique hosts and schemes from URLs
        const hosts = new Set();
        const schemes = new Set();

        applinks.forEach(url => {
            try {
                const urlObj = new URL(url);
                const scheme = urlObj.protocol.slice(0, -1); // Remove trailing colon
                const host = urlObj.host;

                // Print each URL's scheme and host
                console.log(`🔑 Found scheme: ${scheme}`);
                console.log(`🌐 Found host: ${host}`);

                schemes.add(scheme);
                hosts.add(host);
            } catch (error) {
                console.error(`❌ Invalid URL format: "${url}". Please check the URL.`);
                reject(`Invalid URL format: "${url}"`);
            }
        });

        const schemeDataTags = Array.from(schemes).map(scheme => `<data android:scheme="${scheme}" />`).join('\n');
        const hostDataTags = Array.from(hosts).map(host => `<data android:host="${host}" />`).join('\n');

        // Define the intent-filter template
        const intentFilterTemplate = `
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                ${schemeDataTags}
                ${hostDataTags}
            </intent-filter>
        `;

        // Find the MainActivity block and check if the intent-filter already exists
        const activityRegex = /<activity[^>]*android:name="MainActivity"[^>]*>([\s\S]*?)<\/activity>/;
        const match = manifestContent.match(activityRegex);

        if (match) {
            console.log("✏️ Checking if <intent-filter> already exists in MainActivity...");

            const activityContent = match[0];
            const intentFilterExists = /<intent-filter>[\s\S]*?<\/intent-filter>/.test(activityContent);

            let modifiedActivityContent;

            if (intentFilterExists) {
                console.log("🔄 Updating existing <intent-filter> with new hosts and schemes...");
                modifiedActivityContent = activityContent.replace(/<intent-filter>[\s\S]*?<\/intent-filter>/, intentFilterTemplate);
            } else {
                console.log("➕ Adding new <intent-filter> to MainActivity...");
                modifiedActivityContent = activityContent.replace('</activity>', `${intentFilterTemplate}\n</activity>`);
            }

            // Replace the activity content in the manifest with the modified version
            manifestContent = manifestContent.replace(activityContent, modifiedActivityContent);

            // Write the modified content back to AndroidManifest.xml
            fs.writeFileSync(manifestFile, manifestContent, 'utf-8');
            console.log("✅ AndroidManifest.xml updated with deep link URLs inside MainActivity! 🚀");
            resolve();
        }
    });
};