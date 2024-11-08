const fs = require('fs');
const path = require('path');
const et = require('elementtree');

module.exports = function(context) {
    const projectRoot = context.opts.projectRoot;

    // Function to retrieve the App ID from config.xml
    function getAppId(context) {
        const configXmlPath = path.join(context.opts.projectRoot, 'config.xml');
        if (!fs.existsSync(configXmlPath)) {
            console.error(`Error: config.xml not found at path: ${configXmlPath}`);
            return null;
        }

        const configXmlContent = fs.readFileSync(configXmlPath).toString();
        const etree = et.parse(configXmlContent);
        const appId = etree.getroot().attrib.id;

        console.log(`App ID found: ${appId}`);
        return appId;
    }

    // Function to retrieve the applinks string based on the App ID
    function getApplinksFromArgs(appId) {
        console.log('Parsing applinks from process arguments...');

        const args = process.argv;
        let applinksString;

        for (const arg of args) {
            if (arg.includes(`${appId}=`)) {
                const stringArray = arg.split('=');
                applinksString = stringArray.slice(-1).pop();
            }
        }

        if (!applinksString) {
            console.error(`Error: No variable found for App ID "${appId}" in process arguments.`);
            return [];
        }

        console.log(`Raw applinks string for App ID "${appId}": ${applinksString}`);

        // Split the string into individual URLs, trim spaces, and format them
        const applinksArray = applinksString
            .split(',')
            .map(url => url.trim()) // Remove extra spaces around URLs
            .map(url => 'applinks:' + url.replace(/^https?:\/\//, '')); // Add prefix and remove http/https

        console.log(`Formatted applinks: ${applinksArray}`);
        return applinksArray;
    }

    function updateEntitlementsFile(entitlementsFilePath, applinksArray) {
        console.log(`Updating entitlements file: ${entitlementsFilePath}`);
        
        if (!fs.existsSync(entitlementsFilePath)) {
            console.error(`Error: Entitlements file not found at path: ${entitlementsFilePath}`);
            return;
        }

        let entitlementsContent = fs.readFileSync(entitlementsFilePath, 'utf-8');
        
        const applinksXmlArray = applinksArray.map(url => `\t\t<string>${url}</string>`).join('\n');
        const associatedDomainsEntry = `
        <key>com.apple.developer.associated-domains</key>
        <array>
    ${applinksXmlArray}
        </array>
    </dict>\n<\/plist>`;

        // Check if </dict> exists at the end and replace it with the new entry
        if (entitlementsContent.includes('</dict>')) {
            entitlementsContent = entitlementsContent.replace(/<\/dict>\n<\/plist>/, associatedDomainsEntry);
            
            // Write the updated content back to the entitlements file
            fs.writeFileSync(entitlementsFilePath, entitlementsContent, 'utf-8');
            console.log(`Entitlements file updated successfully: ${entitlementsFilePath}`);
        } else {
            console.error(`Error: Closing </dict> tag not found in ${entitlementsFilePath}`);
        }
    }

    const appId = getAppId(context);
    if (!appId) {
        console.error("Error: Could not determine App ID from config.xml.");
        return;
    }

    const applinksArray = getApplinksFromArgs(appId);
    if (applinksArray.length === 0) {
        console.warn("Warning: No applinks found for the current App ID.");
        return;
    }

    const entitlementsFiles = [
        path.join(projectRoot, `platforms/ios/${appId}/Entitlements-Debug.plist`),
        path.join(projectRoot, `platforms/ios/${appId}/Entitlements-Release.plist`)
    ];

    entitlementsFiles.forEach(entitlementsFilePath => {
        updateEntitlementsFile(entitlementsFilePath, applinksArray);
    });
};