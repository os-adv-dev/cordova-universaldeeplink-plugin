const fs = require('fs');
const path = require('path');

module.exports = function (context) {
    const platformRoot = path.join(context.opts.projectRoot, 'platforms/android');
    const manifestFile = path.join(platformRoot, 'app/src/main/AndroidManifest.xml');
    const jsonFile = path.join(context.opts.projectRoot, 'www/applinks.json');

    console.log("🔍 Checking for JSON file with URLs...");

    return new Promise((resolve, reject) => {
        if (!fs.existsSync(jsonFile)) {
            console.error(`❌ JSON file not found: ${jsonFile}`);
            return reject(`JSON file not found: ${jsonFile}`);
        }

        console.log("✅ JSON file found. Reading URLs...");
        const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
        if (!data.applinks || !Array.isArray(data.applinks)) {
            console.error('❌ Invalid JSON format. Expected "applinks" array.');
            return reject('Invalid JSON format. Expected "applinks" array.');
        }

        console.log(`🌐 URLs loaded: ${data.applinks.join(", ")}`);

        // Read the AndroidManifest.xml
        console.log("🔍 Checking for AndroidManifest.xml...");
        if (!fs.existsSync(manifestFile)) {
            console.error(`❌ AndroidManifest.xml not found: ${manifestFile}`);
            return reject(`AndroidManifest.xml not found: ${manifestFile}`);
        }

        console.log("✅ AndroidManifest.xml found. Modifying intent filters...");
        let manifestContent = fs.readFileSync(manifestFile, 'utf-8');

        // Extract unique hosts from URLs
        const hosts = new Set();
        const schemes = new Set();

        data.applinks.forEach(url => {
            const urlObj = new URL(url);
            schemes.add(urlObj.protocol.slice(0, -1)); // Add scheme (remove trailing colon)
            hosts.add(urlObj.host); // Add host
        });

        const schemeDataTags = Array.from(schemes).map(scheme => `<data android:scheme="${scheme}" />`).join('\n');
        const hostDataTags = Array.from(hosts).map(host => `<data android:host="${host}" />`).join('\n');

        // Define the intent-filter template
        const intentFilterTemplate = `
            <intent-filter>
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
        } else {
            console.error("❌ Could not find MainActivity in AndroidManifest.xml");
            reject("MainActivity not found in AndroidManifest.xml");
        }
    });
};