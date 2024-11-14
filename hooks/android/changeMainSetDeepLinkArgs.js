#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Recursive function to search for MainActivity.java
function findMainActivity(dir, fileName) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.lstatSync(fullPath);
        if (stat.isDirectory()) {
            const found = findMainActivity(fullPath, fileName);
            if (found) return found;
        } else if (file === fileName) {
            return fullPath;
        }
    }
    return null;
}

module.exports = function (context) {
    const platformRoot = path.join(context.opts.projectRoot, 'platforms/android');
    const mainActivityPath = findMainActivity(path.join(platformRoot, 'app/src'), 'MainActivity.java');

    if (mainActivityPath) {
        let mainActivityContent = fs.readFileSync(mainActivityPath, 'utf8');

        // Define the new import and check if it already exists
        const newImport = 'import com.outsystems.experts.universalDeepLink.DeepLinkReceived;';
        if (!mainActivityContent.includes(newImport)) {
            // Add the import after 'import android.os.Bundle;'
            const bundleImport = 'import android.os.Bundle;';
            const bundleImportIndex = mainActivityContent.indexOf(bundleImport) + bundleImport.length;
            mainActivityContent = [
                mainActivityContent.slice(0, bundleImportIndex),
                '\n' + newImport,
                mainActivityContent.slice(bundleImportIndex)
            ].join('');
            console.log('---- >>>> ✅ Import added to MainActivity.java');
        } else {
            console.log('---- >>>> ⚠️ Import already exists, skipping.');
        }

        // Define the new code block to be added
        const newCodeBlock = `
        if(getIntent().getData() != null) {
            DeepLinkReceived.INSTANCE.setIntentData(getIntent().getData());
        }
`;

        // Find the position to add the new code block if not already present
        const targetLine = 'Bundle extras = getIntent().getExtras();';
        const conditionLine = 'if (extras != null && extras.getBoolean("cdvStartInBackground", false)) {';

        if (mainActivityContent.includes(newCodeBlock)) {
            console.log('---- >>>> ⚠️ Code block already exists, skipping.');
        } else {
            const targetIndex = mainActivityContent.indexOf(targetLine);
            const conditionIndex = mainActivityContent.indexOf(conditionLine);

            if (targetIndex !== -1 && conditionIndex > targetIndex) {
                mainActivityContent = [
                    mainActivityContent.slice(0, targetIndex + targetLine.length),
                    newCodeBlock,
                    mainActivityContent.slice(targetIndex + targetLine.length)
                ].join('');
                console.log('---- >>>> ✅ Code block added to MainActivity.java');
            } else {
                console.error('---- >>>> ❌ Target position for code block not found.');
            }
        }

        // Write the updated content back to MainActivity.java if changes were made
        fs.writeFileSync(mainActivityPath, mainActivityContent, 'utf8');
        console.log(`---- >>>> ✅ MainActivity.java updated successfully at: ${mainActivityPath}`);
    } else {
        console.error('---- >>>> ❌ MainActivity.java not found! Ensure the project has been built for Android.');
    }
};