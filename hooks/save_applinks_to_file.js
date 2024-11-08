const fs = require('fs');
const path = require('path');

module.exports = function (context) {
    const projectRoot = context.opts.projectRoot;
    const args = process.argv;

    // Create an object to store applinks
    const applinks = {};

    console.log('🔍 Parsing process arguments for plugin installation...');
    args.forEach(arg => {
        if (arg.includes(',')) {
            const [key, value] = arg.split(',');
            applinks[key] = value;
        }
    });

    // Path to save applinks.json
    const applinksFilePath = path.join(projectRoot, 'applinks.json');
    console.log(`📂 Saving applinks to: ${applinksFilePath}`);

    // Save the applinks object to applinks.json
    fs.writeFileSync(applinksFilePath, JSON.stringify(applinks, null, 2), 'utf-8');
    console.log('✅ Applinks saved successfully!');
};