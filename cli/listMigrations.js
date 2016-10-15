var fs = require('fs');

/**
 * Entry point for `mygrate list` functionality
 * @param {array}   args    Args passed to process starting with `list`
 * @param {mygrate} mygrate Migrate library
 */
var run = function(args, mygrate){
    var migrations = mygrate.listMigrations();
    
    if(migrations.length < 1){
        console.log("No migration files found.");
        return;
    }
    
    console.log("Migrations:");
    
    for(var i = 0; i < migrations.length; i ++){
        var m = migrations[i];
        var runString;
        if(m.completed){
            runString = "Ran on " + m.completed;
        } else{
            runString = "Not run"
        }
        console.log("[" + i + "] Table: " + m.table + " - " + m.description + " - " + runString);
    }
}

                    
module.exports = {
    "run" : run
}
