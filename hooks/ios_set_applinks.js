const fs = require('fs');
const path = require('path');
const et = require('elementtree');

module.exports = function (context) {
    const projectRoot = context.opts.projectRoot;

    // Function to retrieve the App ID from config.xml
    function getAppId(context) {
        const configXmlPath = path.join(context.opts.projectRoot, 'config.xml');
        if (!fs.existsSync(configXmlPath)) {
            console.error('❌ Error: config.xml not found at path:', configXmlPath);
            return null;
        }

        const configXmlContent = fs.readFileSync(configXmlPath).toString();
        const etree = et.parse(configXmlContent);
        const appId = etree.getroot().attrib.id;

        console.log(`📱 App ID found: ${appId}`);
        return appId;
    }

    // Function to retrieve the applinks from applinks.json
    function getApplinksFromFile(appId) {
        const applinksFilePath = path.join(projectRoot, 'applinks.json');
        if (!fs.existsSync(applinksFilePath)) {
            console.error(`❌ Error: applinks.json not found at path: ${applinksFilePath}`);
            return [];
        }

        console.log('🔍 Reading applinks from applinks.json...');
        const applinksContent = fs.readFileSync(applinksFilePath, 'utf-8');
        const applinks = JSON.parse(applinksContent);

        const applinksString = applinks[appId];
        if (!applinksString) {
            console.error(`❌ Error: No applinks found for App ID "${appId}" in applinks.json.`);
            return [];
        }

        console.log(`✅ Applinks string found: ${applinksString}`);
        const applinksArray = applinksString.split(',').map(url => url.trim()).map(url => 'applinks:' + url.replace(/^https?:\/\//, ''));
        console.log(`🌐 Formatted applinks array: ${applinksArray}`);
        return applinksArray;
    }

    function updateEntitlementsFile(entitlementsFilePath, applinksArray) {
        console.log(`✏️ Updating entitlements file: ${entitlementsFilePath}...`);

        if (!fs.existsSync(entitlementsFilePath)) {
            console.error(`❌ Error: Entitlements file not found at path: ${entitlementsFilePath}`);
            return;
        }

        console.log('✅ Entitlements file found. Reading content...');
        let entitlementsContent = fs.readFileSync(entitlementsFilePath, 'utf-8');

        const applinksXmlArray = applinksArray.map(url => `\t\t<string>${url}</string>`).join('\n');
        const associatedDomainsEntry = `
        <key>com.apple.developer.associated-domains</key>
        <array>
    ${applinksXmlArray}
        </array>
    </dict>\n<\/plist>`;

        if (entitlementsContent.includes('</dict>')) {
            console.log('🛠️ Found closing </dict> tag. Updating entitlements...');
            entitlementsContent = entitlementsContent.replace(/<\/dict>\n<\/plist>/, associatedDomainsEntry);

            fs.writeFileSync(entitlementsFilePath, entitlementsContent, 'utf-8');
            console.log(`✅ Entitlements file updated successfully: ${entitlementsFilePath}`);
        } else {
            console.error(`❌ Error: Closing </dict> tag not found in ${entitlementsFilePath}`);
        }
    }

    console.log('🚀 Starting iOS hook for Universal Links...');

    const appId = getAppId(context);
    if (!appId) {
        console.error('❌ Error: Could not determine App ID from config.xml.');
        return;
    }

    const applinksArray = getApplinksFromFile(appId);
    if (applinksArray.length === 0) {
        console.warn('⚠️ Warning: No applinks found for the current App ID.');
        return;
    }

    console.log(`📂 Preparing to update entitlements for App ID: ${appId}`);
    const entitlementsFiles = [
        path.join(projectRoot, `platforms/ios/${appId}/Entitlements-Debug.plist`),
        path.join(projectRoot, `platforms/ios/${appId}/Entitlements-Release.plist`)
    ];

    entitlementsFiles.forEach(entitlementsFilePath => {
        updateEntitlementsFile(entitlementsFilePath, applinksArray);
    });

    console.log('🎉 iOS hook for Universal Links completed successfully!');
};