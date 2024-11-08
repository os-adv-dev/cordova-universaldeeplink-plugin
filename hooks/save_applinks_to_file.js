const fs = require('fs');
const path = require('path');

module.exports = function (context) {
    const projectRoot = context.opts.projectRoot;
    const args = process.argv;

    // Create an object to store applinks
    const applinks = {};

    console.log('🔍 Parsing process arguments for plugin installation...');

    args.forEach(arg => {
        // Check if the argument contains a variable definition in the form "name=value"
        const equalsIndex = arg.indexOf('=');
        if (equalsIndex > 0) {
            const key = arg.substring(0, equalsIndex).trim(); // Get everything before the first '='
            const value = arg.substring(equalsIndex + 1).trim(); // Get everything after the first '='
            applinks[key] = value; // Add to applinks object
        }
    });

    // Path to save applinks.json
    const applinksFilePath = path.join(projectRoot, 'applinks.json');
    console.log(`📂 Saving applinks to: ${applinksFilePath}`);

    // Save the applinks object to applinks.json
    try {
        fs.writeFileSync(applinksFilePath, JSON.stringify(applinks, null, 2), 'utf-8');
        console.log('✅ Applinks saved successfully!');
    } catch (error) {
        console.error(`❌ Error saving applinks to file: ${error.message}`);
    }
};