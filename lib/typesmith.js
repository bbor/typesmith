
var assert = require('assert');

var fast_filter = require('fast-filter');
var thunkify = require('thunkify');
var unyield = require('unyield');
var Ware = require('ware');

module.exports = typesmith;


/*
  Initialize a new instance of `typesmith`.
  The config is optional.
*/
function typesmith(config){
  if (!(this instanceof typesmith)) return new typesmith(config);
  this.config = config || {};
  this.config.types = this.config.types || {};
  this.plugins = [];
  this.db = {};
}


/*
  Generates a unique ID for a record based on its name and type.
*/
typesmith.prototype.generate_uid = function(name, type){
  var uid = type + '_' + name;
  uid = uid.replace(/\W/g,'_');
  if (this.db[uid]) {
    var disambig = 1;
    var testuid = uid + '_' + disambig;
    if (this.db[testuid]) {
      while (this.db[testuid]) {
        disambig++;
        testuid = uid + '_' + disambig;
      }
    }
    uid = testuid;
  }
  return uid;
};


/*
  Adds new record or records to the database.
  If record is an array, each item will be added separately.
  Each item must have a `name` and a `type`, or you can provide them in the parameters.
  A new UID will be generated for the record, saved in its `uid` key, and the record
  will be saved in the database with that UID as its key.
  If the object has a UID already or if you provide one, and that UID is unique, your UID will be used.
*/
typesmith.prototype.add_to_db = function(records, name, type, uid){
  records = records || {};
  if (!Array.isArray(records))
  {
    records = [records];
  }
  for (var i_record = 0; i_record < records.length; i_record++)
  {
    var record = records[i_record];
    record.name = record.name || name;
    record.type = record.type || type;
    assert(record.name && record.type, "This record needs a name and a type!" + JSON.stringify(record));
    var test_uid = record.uid || uid;
    if (test_uid && !this.db[test_uid]) {
      record.uid = test_uid;
    } else {
      record.uid = this.generate_uid(record.name, record.type);
    }
    record.children = record.children || []; // children and parent fields will record uid fields from the main db object, to avoid circularity.
    this.db[record.uid] = record;
  }
};


/*
  Adds a new plugin function to the pipeline.
*/
typesmith.prototype.use = function(plugin){
  this.plugins.push(plugin);
  return this;
};


/*
  Runs through the chain of plugins.
*/
typesmith.prototype.run = unyield(function*(plugins){
  var ware = new Ware(plugins || this.plugins);
  var run = thunkify(ware.run.bind(ware));
  var res = yield run(this);
  return res[0];
});


// internal helper returns the typesmith db as an array, or the specified array if one is given.
function get_db_to_use(tsm, db)
{
  var db_to_use = Object.values(tsm.db);
  if (db) {
    if (Array.isArray(db))
    {
      db_to_use = db;
    } else {
      db_to_use = Object.values(db);
    }
  }
  return db_to_use;
}

/*
  Filters the database to retrieve an array of all records that match the given type or array of types.
  Omit db to use the main typesmith db.
*/
typesmith.prototype.records_of_type = function(types, db){
  if (!Array.isArray(types))
  {
    types = [types];
  }
  return fast_filter(get_db_to_use(this, db), function(record) { return types.includes(record.type); });
};


/*
  Filters the database to retrieve an array of all records with a given name.
  You can use the types argument to specify a type name or a set of type names to filter against.
  Omit db to use the main typesmith db.
*/
typesmith.prototype.lookup_by_name = function(name, types, db){
  if (types && !Array.isArray(types))
  {
    types = [types];
  }
  return fast_filter(get_db_to_use(this, db), function(record) { return record.name == name && (!types || types.includes(record.type)); });
};


/*
  Filters the database to retrieve only records that satisfy a given function.
  Omit db to use the main typesmith db.
*/
typesmith.prototype.filter = function(func, db){
  return fast_filter(get_db_to_use(this, db), func);
};
