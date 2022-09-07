/**
 * File: sqlite.js.
 * Author: W A P.
 * Email: 610585613@qq.com.
 * Datetime: 2018/07/24.
 */
 
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
 
var DB = DB || {};
 
DB.SqliteDB = function(file, callback){
    this.exist = fs.existsSync(file);
    if(!this.exist){
        console.log("Creating db file!");
        // fs.openSync(file, 'w');
    };

    this.db = new sqlite3.Database(file);

    callback && callback.call(this, this.exist)
};
 
DB.printErrorInfo = function(err){
    console.log("Error Message:" + err.message);
};
 
DB.SqliteDB.prototype.createTable = function(sql){
    this.db.serialize(()=>{
        this.db.run(sql, function(err){
            if(null != err){
                DB.printErrorInfo(err);
                return;
            }
        });
    });
};
 
/// tilesData format; [[level, column, row, content], [level, column, row, content]]
DB.SqliteDB.prototype.insertData = function(sql, objects){
    return new Promise((resolve, reject) => {
        this.db.serialize(()=>{
            var stmt = this.db.prepare(sql);
            for(var i = 0; i < objects.length; ++i){
                stmt.run(objects[i], (err) => {
                    if (err && err.errno) {
                        console.error(err.message)
                        resolve({code: 500, data: err.message})
                    } else {
                        
                    }
                });
            }
        
            stmt.finalize();

            resolve({code: 200, data: 'success'})
        });
    })
};
 
DB.SqliteDB.prototype.queryData = function(sql, callback){
    return new Promise((resolve, reject) => {
        this.db.all(sql, function(err, rows){
            if(null != err){
                DB.printErrorInfo(err);
                return;
            }
            /// deal query data.
            resolve({
                code: 200,
                data: rows
            })
        });
    })
};
 
DB.SqliteDB.prototype.executeSql = function(sql){
    return new Promise((resolve)=> {
        this.db.run(sql, function(err){
            if(err && err.errno){
                DB.printErrorInfo(err);
                resolve({
                    code: 500,
                    data: err.message
                })
            }
            resolve({
                code: 200,
                data: 'success'
            })     
        });
    })

};
 
DB.SqliteDB.prototype.close = function(){
    this.db.close();
};
 
/// export SqliteDB.
exports.SqliteDB = DB.SqliteDB;
