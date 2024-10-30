var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');

// Define the path to the config.xml file
var configXmlPath = 'config.xml';

// Read the config.xml file to retrieve the project name
fs.readFile(configXmlPath, 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }

    // Parse the XML data to extract the project name
    xml2js.parseString(data, function (parseErr, result) {
        if (parseErr) {
            return console.log(parseErr);
        }

        var projectName = result.widget.name[0];

        // Define the path to the bridging header file using the project name
        var bridgingHeaderPath = path.join('platforms', 'ios', projectName, 'Bridging-Header.h');

        // Define the import statement you want to add
        var importStatement = '#import "AppDelegate.h"';

        // Check if the import statement already exists in the bridging header
        fs.readFile(bridgingHeaderPath, 'utf8', function (readErr, bridgingHeaderData) {
            if (readErr) {
                return console.log(readErr);
            }
            if (!bridgingHeaderData.includes(importStatement)) {
            // Add the import statement to the bridging header
            fs.appendFile(bridgingHeaderPath, importStatement + '\n', function (appendErr) {
                if (appendErr) {
                    return console.log(appendErr);
                }
                console.log('Import statement added to bridging header.');
            });
            } else {
                console.log('Import statement already exists in bridging header.');
            }
        });
    });
});