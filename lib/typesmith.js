
var assert = require('assert');

var fast_filter = require('fast-filter');
var thunkify = require('thunkify');
var unyield = require('unyield');
var Ware = require('ware');
var _ = require('lodash');
var hierdb = require('hier-db');

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
  this.db = new hierdb();
}


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


