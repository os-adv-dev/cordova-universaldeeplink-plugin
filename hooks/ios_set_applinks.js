const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

module.exports = function(context) {
    const projectRoot = context.opts.projectRoot;
    const applinksFilePath = path.join(projectRoot, 'platforms/ios/www/applinks.json');

    function getProjectName() {
        console.log('Reading project name from config.xml...');
        const configPath = path.join(projectRoot, 'config.xml');
        
        if (!fs.existsSync(configPath)) {
            console.error(`Error: config.xml not found at path: ${configPath}`);
            return null;
        }
        
        const config = fs.readFileSync(configPath).toString();
        let name = null;
        
        xml2js.parseString(config, (err, result) => {
            if (err) throw err;
            name = result.widget.name[0].trim();
            console.log(`Project name found: ${name}`);
        });
        
        return name;
    }

    function getApplinks() {
        console.log(`Reading applinks from ${applinksFilePath}...`);
        
        if (!fs.existsSync(applinksFilePath)) {
            console.error(`Error: applinks.json not found at path: ${applinksFilePath}`);
            return [];
        }
        
        try {
            const applinksContent = fs.readFileSync(applinksFilePath, 'utf-8');
            const applinksJson = JSON.parse(applinksContent);
            
            if (!Array.isArray(applinksJson.applinks)) {
                console.error(`Error: 'applinks' key is missing or is not an array in applinks.json`);
                return [];
            }
            
            const formattedApplinks = applinksJson.applinks.map(url => 'applinks:' + url.replace(/^https?:\/\//, ''));
            console.log(`Applinks found and formatted: ${formattedApplinks}`);
            return formattedApplinks;
        } catch (error) {
            console.error(`Error parsing applinks.json: ${error.message}`);
            return [];
        }
    }

    function updateEntitlementsFile(entitlementsFilePath, applinksArray) {
        console.log(`Updating entitlements file: ${entitlementsFilePath}`);
        
        if (!fs.existsSync(entitlementsFilePath)) {
            console.error(`Error: Entitlements file not found at path: ${entitlementsFilePath}`);
            return;
        }

        let entitlementsContent = fs.readFileSync(entitlementsFilePath, 'utf-8');
        //console.log(`Original entitlements file content:\n${entitlementsContent}`);
        
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
            //console.log(`Modified entitlements file content:\n${entitlementsContent}`);
            
            // Write the updated content back to the entitlements file
            fs.writeFileSync(entitlementsFilePath, entitlementsContent, 'utf-8');
            console.log(`Entitlements file updated successfully: ${entitlementsFilePath}`);
        } else {
            console.error(`Error: Closing </dict> tag not found in ${entitlementsFilePath}`);
        }
    }

    const projectName = getProjectName();
    if (!projectName) {
        console.error("Error: Could not determine project name from config.xml.");
        return;
    }

    const applinksArray = getApplinks();
    if (applinksArray.length === 0) {
        console.warn("Warning: No applinks found in applinks.json.");
        return;
    }

    const entitlementsFiles = [
        path.join(projectRoot, `platforms/ios/${projectName}/Entitlements-Debug.plist`),
        path.join(projectRoot, `platforms/ios/${projectName}/Entitlements-Release.plist`)
    ];

    entitlementsFiles.forEach(entitlementsFilePath => {
        updateEntitlementsFile(entitlementsFilePath, applinksArray);
    });
};