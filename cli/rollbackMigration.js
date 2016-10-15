//rollback [ix] <force>
//rollback to [ix] <force>
//rollback all <force>

var commandUsage = "Command usage: mygrate rollback:\n" + 
                    "\t[index] <force> - rolls back specific migration, index from `mygrate list` may be used to rerun a specific rollback\n" +
                    "\tto [index] <force> - rolls back all migrations to specified (not including) index\n" + 
                    "\tall <force> - rolls back all migrations";

var forceFlag = false;


var run = function(args, mygrate){
    forceFlag = getForceFlag(args);
    
    if(args[1] === "all"){
        rollBackAllMigrations(args, mygrate);
    } else if(args[1] === "to"){
        rollBackToMigration(args, mygrate);
    } else if(!isNaN(args[1])){
        rollBackSingleMigration(args, mygrate);
    } else{
        throw commandUsage;
    }   
}

/**
 * Determines if the force flag is set
 * @param {array} args Args passed to the process
 */
function getForceFlag(args){
    var force = false;
    if(args.length < 2){
        throw commandUsage;
    } 
    
    for(var i = 0; i < args.length; i ++){
        if(args[i] === "force"){
            forceFlag = true;
            args.splice(i, 1);
            break;
        }
    }
    
    return force;
}

function rollBackSingleMigration(args, mygrate){
    var migrations = mygrate.listMigrations();
    var index = args[1];

    if(isNaN(index)){
        throw commandUsage;
    }

    if(index > (migrations.length - 1)){
        throw "Index must be from 0 to " + (migrations.length - 1);
    }
    try{
        mygrate.rollBackMigration(migrations[index], forceFlag);
    } catch(e){
        if(forceFlag){
            throw e;
        } else{
            console.log("Skipping exception: " + e);
        }
    }
}

function rollBackToMigration(args, mygrate){
    var migrations = mygrate.listMigrations();
    var endIndex = args[2];
    
    var firstMigration = null;
    var curMigration = null;
    
    //Building a "linked list" of sorts for callback chaining
    for(var i = migrations.length - 1; i > endIndex; i --){
        var m = migrations[i];
        if(!m.completed){
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
        mygrate.rollBackMigration(firstMigration, forceFlag);
    } else{
        console.log("No migrations to roll back.");
    }
}

function rollBackAllMigrations(args, mygrate){
    var migrations = mygrate.listMigrations();
    
    var firstMigration = null;
    var curMigration = null;
    
    //Building a "linked list" of sorts for callback chaining
    for(var i = migrations.length - 1; i >= 0; i --){
        var m = migrations[i];
        if(!m.completed){
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
        mygrate.rollBackMigration(firstMigration, forceFlag);
    } else{
        console.log("No migrations to roll back.");
    }
}


module.exports = {
    "run" : run
}