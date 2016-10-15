var commandUsage = "Command Options:\n" +
                    "\trun - roll up migration(s)\n" + 
                    "\trollback - roll back migration(s)\n" +
                    "\tlist - list all migrations\n" +
                    "\tcreate - create a migration file";

var options = {
    "list" : require("./listMigrations.js"),
    "run" : require("./runMigration.js"),
    "create" : require("./createMigration.js"),
    "rollback" : require("./rollbackMigration.js")
}

var main = function(mygrate){
    var args = process.argv;
    
    while(args.length > 0){
        
        for(var opt in options){
            if(opt === args[0]){
                options[opt].run(args, mygrate);
                return;
            }
        }
        
        var args = args.splice(1);
    }
    
    
    throw commandUsage;
}

module.exports = {
    "main" : main
}
