//create table [table]
//create column [table] [coldef...]
//

var commandUsage = "mygrate create \n" + 
                    "\ttable [table] <column1:type> <column2:type> ...\n" + 
                    "\tcolumn [table] [column1:type] <column2:type> ...\n" + 
                    "\tempty [mygrate_file_name]";

var run = function(args, mygrate){
    var functions = {
        "table" : createTable,
        "column" : addColumn,
        "empty" : emptyMigration
    }
    
    if(args.length < 2){
        throw commandUsage;
    }
    
    for(var fn in functions){
        if(args[1] === fn){
            functions[fn](args, mygrate);
            return;
        }
    }
    
    throw commandUsage;
}

/**
 * Generates a migration file to create a table in the db
 * @param {array}   args    Arguments
 * @param {mygrate} mygrate Mygrate library
 */
var createTable = function(args, mygrate){
    var tableName = args[2];
    var createSql = "CREATE TABLE " + tableName + " (";
    
    for(var i = 3; i < args.length; i ++){
        var column = args[i];
        var splitIx = column.indexOf(":");
        var columnName = "`" + column.substring(0, splitIx) + "`";
        var columnType = column.substring(splitIx + 1, column.length);
        
        createSql += columnName + " " + columnType;
        
        if(i < (args.length - 1)){
            createSql += ", ";
        }
    }
    
    createSql += ")";
    
    mygrate.createMigrationFile(tableName, "create_table_" + tableName, createSql, "DROP TABLE " + tableName, "Create table " + tableName);
}

/**
 * Adds columns to the table
 * @param {array}   args    Args for process
 * @param {mygrate} mygrate Mygrate library
 */
var addColumn = function(args, mygrate){
    console.log(args);
    var tableName = args[2];
    
    if(tableName.contains(":")){
        throw commandUsage;
    }
    
    var addSql = "ALTER TABLE " + tableName + " ADD COLUMN (";
    var dropSql = "ALTER TABLE " + tableName + " ";
    
    for(var i = 3; i < args.length; i ++){
        var column = args[i];
        var splitIx = column.indexOf(":");
        var columnName = "`" + column.substring(0, splitIx) + "`";
        var columnType = column.substring(splitIx + 1, column.length);
        
        addSql += columnName + " " + columnType;
        dropSql += "DROP COLUMN " + columnName;
        
        if(i < (args.length - 1)){
            addSql += ", ";
            dropSql += ", ";
        }
        
        
    }
    addSql += ")";
        
    
    mygrate.createMigrationFile(tableName, "add_columns_" + tableName, addSql, dropSql, "Add columns to table " + tableName);
}

/**
 * Generates a migration file to create a table in the db
 * @param {array}   args    Arguments
 * @param {mygrate} mygrate Mygrate library
 */
var emptyMigration = function(args, mygrate){
    var fileName = args[2];
    
    mygrate.createMigrationFile(tableName, fileName, "SET UP SQL HERE", "TEAR DOWN SQL HERE", "Custom migration");
}

module.exports = {
    "run" : run
}