const fs = require('fs');
const mysql = require('mysql');


settings = {};
settings.host = "";
settings.user = "";
settings.password = "";
settings.database = "";
settings.port = 3306;
settings.dir = __dirname + "/migrations";


/**
* Sets up the migration tool
* @param host Host address of the database
* @param user Username for the database
* @param password Password for the database
* @param database Name of the database
* @param port Port for MySql defaults to 3306
* @param dir Directory containing the migration files
*/
setup = function(host, user, password, database, port, dir){
    if(port){
        settings.port = port;
    }
    
    if(dir){
        settings.dir = dir;
    }
    
    settings.completedMigrations = settings.dir +  "/migrations_run.json";

    settings.host = host;
    settings.user = user;
    settings.password = password;
    settings.database = database;
    
    if(!fs.existsSync(settings.dir)){
        console.log("Creating migration directory: " + settings.dir);
        fs.mkdirSync(settings.dir);
    }
    
    if(!fs.existsSync(settings.completedMigrations)){
        var completedObj = {migrations: {}};
        fs.writeFileSync(settings.completedMigrations, JSON.stringify(completedObj, null, 4) + "\n");
    }
}


/**
* Writes an empty migration file
* @param table Name of the table being modified
* @param name Title to give the migration file - defaults to "mygrate"
* @param rollup SQL command(s) to run to roll up this migration
* @param rollback SQL command(s) to roll back this migration
* @param description Description of what this migration does
*/
createMigrationFile = function(table, name, rollup = "", rollback = "", description = "No description"){
    var filename = new Date().getTime() + "__" + table + "__";
    
    if(name){
        filename += name;
    } else{
        filename += "migrate";
    }
    
    filename += ".migration";
        

    var migrationObject = {
        "table" : table,
        "description" : description,
        "rollup" : rollup,
        "rollback" : rollback
    };
    
    var path = settings.dir + "/" + filename;

    fs.writeFileSync(path, JSON.stringify(migrationObject, null, 4) + "\n");
    console.log("Migration file saved: " + path);
}

/**
* Returns a list of migrations sorted by date in asscending order
* object {tableName, description, rollUp, rollBack, time, completed}
* tableName - name of table
* description - description of the migration
* rollUp - roll up sql
* rollBack - roll back sql
* time - time file was created
* completed - time roll up was run
*/
listMigrations = function(){
    var files = fs.readdirSync(settings.dir);
    var migrations = [];
    var completedMigrations = getCompletedMigrations();
    
    for(var i = 0; i < files.length; i ++){
        var fileName = files[i];
        if(fileName.indexOf(".migration") <= 0){
            continue;
        }
        var completed = null;
        
        for(var f in completedMigrations){
            if(f === fileName){
                completed = new Date(parseInt(completedMigrations[f]));
                break;
            } 
        }
        
        var migration = {};
        try{
            migration = JSON.parse(fs.readFileSync(settings.dir + "/" + fileName));
        } catch(e){
            continue;
        }
        
        var millis = fileName.substr(0, fileName.indexOf("_"));
        migration.time = new Date(parseInt(millis));
        migration.completed = completed;
        migration.filename = fileName;
        
        migrations.push(migration);
    }
    
    migrations.sort((first, second) => {
        return first.time.getTime() - second.time.getTime();
    });
    
    return migrations;
}

/**
 * Returns a list of completed migration filenames and the time it was run
 * @returns {Array} List of completed migrations {filename, time}
 */
var getCompletedMigrations = function(){
    var completeFile = settings.completedMigrations;
    if(!fs.existsSync(completeFile)){
        return [];
    }
    var file = JSON.parse(fs.readFileSync(completeFile));
    if(file.migrations){
        return file.migrations;
    }
    
    return[];
}



function updateRunMigrationsFile(filename, timestamp){
    var completed = getCompletedMigrations();
    
    if(timestamp){
        completed[filename] = timestamp;
    } else if(completed[filename]){
        //Got null for timestamp, remove it from the completed list (rollback scenario)
        delete completed[filename];
    }
    
    var migrationsObj = {
        "migrations" : completed
    }
    
    fs.writeFileSync(settings.completedMigrations, JSON.stringify(migrationsObj, null, 4) + "\n");
}


rollUpMigration = function(migration, force = false){
    con = openConnection();
    console.log("Rolling up migration for table, " + migration.table + ": " + migration.rollup);
    
    con.query(migration.rollup, (err) => {
        if(!force && err){
            throw err;
        } else if(err){
            console.error("Got exception while running migration: " + err);
        }
        
        updateRunMigrationsFile(migration.filename, time.getMilliseconds());
        
        if(migration.next){
            rollUpMigration(migration.next, force);
        }
    });
    closeConnection(con);
    var time = new Date();
}

rollBackMigration = function(migration, force = false){
    con = openConnection();
    console.log("Rolling back migration for table, " + migration.table + ": " + migration.rollback);
    
    con.query(migration.rollback, (err) => {
        if(!force && err){
            throw err;
        } else if(err){
            console.error("Got exception while rolling back migration: " + err);
        }
        
        updateRunMigrationsFile(migration.filename, null);
        
        if(migration.next){
            rollBackMigration(migration.next, force);
        }
    });
    closeConnection(con);
    var time = new Date();
}

openConnection = function(){
    // First you need to create a connection to the db
    var con = mysql.createConnection({
        host: settings.host,
        user: settings.user,
        password: settings.password,
        database: settings.database,
        port: settings.port
    });
    
    con.connect(function(err){
    if(err){
        throw err;
    }
        //console.log('Connection to database established');
    });
    
    return con;
}

closeConnection = function(con){
    
    con.end(function(err) {
        // The connection is terminated gracefully
        // Ensures all previously enqueued queries are still
        // before sending a COM_QUIT packet to the MySQL server.
        if(err){
            throw err;
        }
    });
}


module.exports = {
    "createMigrationFile": createMigrationFile,
    "setup": setup,
    "listMigrations" : listMigrations,
    "rollUpMigration" : rollUpMigration,
    "rollBackMigration" : rollBackMigration
}
