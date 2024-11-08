const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

module.exports = function(context) {
    const projectRoot = context.opts.projectRoot;

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

    function getApplinksFromArgs() {
        console.log('Parsing applinks from process arguments...');
        
        const args = process.argv;
        let applinksString;
        for (const arg of args) {  
            if (arg.includes('APPLINKS')) {
                const stringArray = arg.split('=');
                applinksString = stringArray.slice(-1).pop();
            }
        }
        
        if (!applinksString) {
            console.error('Error: APPLINKS argument not found in process arguments.');
            return [];
        }
        
        console.log(`Raw applinks string: ${applinksString}`);
        
        // Split the string into individual URLs, trim spaces, and format them
        const applinksArray = applinksString
            .split(',')
            .map(url => url.trim()) // Remove extra spaces around URLs
            .map(url => 'applinks:' + url.replace(/^https?:\/\//, '')); // Add prefix and remove http/https

        console.log(`Applinks found and formatted: ${applinksArray}`);
        
        return applinksArray;
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

    const applinksArray = getApplinksFromArgs();
    if (applinksArray.length === 0) {
        console.warn("Warning: No applinks found in process arguments.");
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