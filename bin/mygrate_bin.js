#!/usr/bin/env node

var mygrate = require('../mygrate.js');
var cli = require('../cli/cli.js');
var path = require('path');
var fs = require('fs');



global.mygrateDir = path.resolve(process.cwd());
var mygrateSettingsFile = global.mygrateDir + "/mygrate.json";
console.log(global.mygrateDir);


if(!fs.existsSync(mygrateSettingsFile)){
    var settingsObj = {
        "host" : "localhost",
        "database" : "",
        "user" : "",
        "password" : "",
        "port" : "3306"
    }
    
    fs.writeFileSync(mygrateSettingsFile, JSON.stringify(settingsObj, null, 4) + "\n");
    console.log("No mygrate.json file found, it was created. Please fill it with your mysql connection information.");
    return;
}

var settings = JSON.parse(fs.readFileSync(mygrateSettingsFile));

mygrate.setup(settings.host,
                settings.user,
                settings.password,
                settings.database,
                settings.port,
                global.mygrateDir + "/migrations");


cli.main(mygrate);
