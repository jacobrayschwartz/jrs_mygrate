var commandUsage = "Command usage: mygrate run <option> <force>\n" + 
                    "\t if no option, runs all migrations that have not been run\n"
                    "\toption: index - runs specific rollup from `mygrate list`, you may rerun migrations with this option\n" +
                    "\toption: all - runs all rollups, regardless of what migrations have been run\n" + 
                    "\tforce: continue running migrations on error";

var forceFlag = false;

    
/**
 * Entry point for all 'run' commands
 * Run all migrations after last run
 * Run specific migration
 * 
 * @param {array}   args    All arguments to the migrations script (first arg should be 'run')
 * @param {mygrate} mygrate Library object that handles the details for migrations
 */
var run = function (args, mygrate){
    forceFlag = getForceFlag(args);
    
    if(args.length == 1){
        //User wants to run all un-run migrations
        runAllMigrations(args, mygrate);
        return;
    }
    else if(!isNaN(args[1])){
        //User wants to run specific migrations
        runSingleMigration(args, mygrate);
        return;
    }
    
}

/**
 * Determines if the force flag is set
 * @param {array} args Args passed to the process
 */
function getForceFlag(args){
    var force = false;
    if(args.length < 1){
        throw commandUsage;
    } if(args.length == 2){
        force = args[1] === "force";
        if(force) args.splice(1,1);
    } else{
        force = args[2] === "force";
        if(force) args.splice(2,1);
    }
    
    return force;
}

/**
 * Runs a single migration - user command node `mygrate run [index of migration from list function]`
 * @param {array}   args    Arguments for the process
 * @param {mygrate} mygrate Migrate library
 */
function runSingleMigration(args, mygrate){
    var migrations = mygrate.listMigrations();
    var index = args[1];

    if(isNaN(index)){
        throw commandUsage;
    }

    if(index > (migrations.length - 1)){
        throw "Index must be from 0 to " + (migrations.length - 1);
    }
    try{
        mygrate.rollUpMigration(migrations[index], forceFlag);
    } catch(e){
        if(forceFlag){
            throw e;
        } else{
            console.log("Skipping exception: " + e);
        }
    }
}

/**
 * Runs all migrations that are not listed as being run in the file migrations/migration_run.json
 * @param {array}   args    Args passed to the function
 * @param {mygrate} mygrate Mygrate library
 */
function runAllMigrations(args, mygrate){
    var migrations = mygrate.listMigrations();
    
    var firstMigration = null;
    var curMigration = null;
    
    //Building a "linked list" of sorts for callback chaining
    for(var i = 0; i < migrations.length; i ++){
        var m = migrations[i];
        if(m.completed){
            continue;
        }
        
        if(!firstMigration){
            firstMigration = m;
        } else{
            curMigration.next = m;
        }
        curMigration = m;
    }
    
    if(firstMigration){
        mygrate.rollUpMigration(firstMigration, forceFlag);
    } else{
        console.log("No migrations to run.");
    }
}

module.exports = {
    "run" : run
}
