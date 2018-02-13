# Typesmith -- a data processing pipeline

Typesmith is a `node.js` module that runs a set of processing functions (called *plugins*) that operate on a database of typed records.

Its main intent (for the moment, at least) is to prepare a database for passing it to [mixtape](http://www.github.com/bbor/mixtape), a module that generates a static site for browsing and searching the elements in the database. But in principle you could use it to chain together any kind of operations on a collection of data records.

## Benefits

You could simply do your data manipulation in your own code functions. But, using the modular Typesmith plug-in system is nice because it offers modularity: each plug-in is self-contained and interacts with other plug-ins and the core typesmith system only through the modifications they make to the data. Because the plugins are modular, they are also easily re-usable in multiple projects without side-effects. They also simplify the use of asynchronous Javascript, as each plug-in only begins its tasks when the previous plug-in has completely finished its processing.

## Usage

1.	Use `npm install` in a `node.js` project to install typesmith and all the plug-ins that you'll need.

	```js
	npm install typesmith
	npm install typesmith-read-json
	npm install typesmith-mixtape
	...
	```

2.	At the top of your module's code, require these typesmith modules.

	```js
	var typesmith = require('typesmith');
	var readJson = require('typesmith-read-json');
	var mixtape = require('typesmith-mixtape');
	...
	```

3.	You'll need to create a configuration object that contains:

	-	a `types` object that defines the types your database will handle. Depending on what plug-ins you want to use, you might also have other type-specific configuration settings you can set in this config.

	-	optional configuration settings for each of the plug-ins you want to chain together.

	You could read this config object from a JSON file, or construct it dynamically in your code. See the following sections for more details.

4.	Call the `typesmith` constructor, and pass it your config.

5.	For each plug-in you want to use, call the `.use()` function on the returned Typesmith object and pass your plug-in.

6.	Once you've set up all your plug-ins, call the `.run` function to run the chain of processing functions. You can also pass this function a callback that will be called after all the plugins have finished.

All in all:

```js
// require modules
var fs =            require('fs');
var typesmith =     require('typesmith');
var readJson =      require('typesmith-read-json');
var readMarkdown =  require('typesmith-read-markdown');
var autoparent =    require('typesmith-autoparent');
var subgroup =      require('typesmith-subgroup');
var writeJson =     require('typesmith-write-json');
var writeHtml =     require('typesmith-mixtape');

// read a config from JSON
var config_content = fs.readFileSync('./configs/lua_config.json', 'utf8');
var config = JSON.parse( config_content );

// create the Typesmith object, add the plug-ins, and run the chain.
typesmith(config).use(readJson())
  .use(readMarkdown())
  .use(autoparent())
  .use(subgroup())
  .use(writeJson())
  .use(writeHtml())
  .run( function(errmsg) { if (errmsg) { console.log("Error: " + errmsg); } console.log('finished the run!'); } );
```

## The types config

The types config is expected to be the same thing as Mixtape's: an object that contains an object for each type of record that the database holds. Plug-ins (and eventually Mixtape) use this type config as a way to determine the possible relationships between these different types of records (e.g. class records can be parents of function records, but not vice-versa). The type config can also contain configuration parameters that tell plug-ins (and eventually Mixtape) how to treat records of this type.

A sample config:

```js
{
  "types":{
    "namespace":{
      "child_types":["namespace","class","function","member"],
      "subgroup_title":"Namespaces",
      "icon":"images/icon_namespace.png"
    },
    "class":{
      "child_types":["function","member"],
      "subgroup_title":"Classes",
      "icon":"images/icon_read_only.png"
    },
    "function":{
      "child_types":[],
      "subgroup_title":"Functions"
    },
    "member":{
      "child_types":[],
      "subgroup_title":"Members"
    }
  }
  // ...
}
```

For more, see the Mixtape readme, and see the readmes for the individual plugins for information about what parameters are read from the types config.

## Plugin configurations

Some plugins need configuration parameters too. You can pass them in multiple ways:

-	By setting them in the config object you pass to mixtape, under a key with the name of the plug-in you're using:

	```js
	{
		"types": ...
		"typesmith-autoparent":{
			"scope_separator":"."
			// parameters for the typesmith-autoparent plug-in go here
		},
		"typesmith-subgroup":{
			"subgroup_by_key":"group"
			// parameters for the typesmith-subgroups plug-in go here
		}
		...
	}
	```

-	By passing the configuration object directly to the plugin when you call `use()`:

	```js
	typesmith(config).use(readJson())
	  .use(readMarkdown())
	  .use(autoparent({
		  "scope_separator":"."
		  // parameters for the typesmith-autoparent plug-in can go here
	  }))
	  ...
	```

-	By setting them in the type configuration;

-	By setting them directly on individual data records.

The above is also the order of precedence: parameters set on data records take priority over the other config locations.

## Plugins

There are a few plug-ins already available for Typesmith:

-	[typesmith-read-json](http://www.github.com/bbor/typesmith-read-json): Reads JSON data from files into the Typesmith database.

-	[typesmith-read-markdown](http://www.github.com/bbor/typesmith-read-markdown): Reads a folder of Markdown files into the Typesmith database as records of type `page`.

-	[typesmith-autoparent](http://www.github.com/bbor/typesmith-autoparent): Looks through the Typesmith database and creates parent-child relationships based on the `name` field of the elements.

-	[typesmith-subgroup](http://www.github.com/bbor/typesmith-subgroup): If your records in the Typesmith database have children of different types, this plug-in splits those children up into subgroups by type, or by the value of a data key you provide.

-	[typesmith-write-json](http://www.github.com/bbor/typesmith-write-json): Dumps the records from the Typesmith database out into an array in a JSON file.

-	[typesmith-mixtape](http://www.github.com/bbor/typesmith-mixtape): Runs Mixtape to generate a static site for the elements and content in the Typesmith database.

Other plug-ins planned or in progress:

-	A parser that reads records and type values from text files and source code comments.

-	A plug-in that reads in source code files and headers, and reproduces them in a browsable format in the Mixtape site.

-	A plug-in that follows "inheritance" relationships, and copies children from the inherited record to its inheritors.

... but there's still a lot to do on the core of Mixtape before I get there.

## Example

See the [typesmith-testing](http://www.github.com/bbor/typesmith-testing) repository for an example project that shows how you could set up Typesmith pipelines for a couple of APIs that go from JSON inputs to a full Mixtape site.

## Inspiration

Typesmith is inspired by [Metalsmith](http://www.metalsmith.io), a static site generator that reads files from a source directory into a database and applies a pipeline of transformations to those files. The typical usage for Metalsmith is to take Markdown files, process them, add metadata, and run them through a templating engine to create a blog or other kind of static HTML site.

In fact, I could have used Metalsmith as-is for the core of Typesmith, and just written plug-ins to fill the database with other kinds of records than files. However, Metalsmith has some basic assumptions that I thought would be distracting -- concepts like "source directory" and "destination directory" -- plus, most of the existing plug-ins for Metalsmith were written on the assumption that the database would be full of file records keyed by their path and filename within the source folder. I thought it would be cleaner to keep Typesmith as a separate system for generic data records, rather than try to re-purpose Metalsmith itself.

## Writing your own plug-ins

A plugin is basically just a function that gets invoked when you call `typesmith.run`. The plugin function gets passed:

-	the instance of `typesmith` that is running the pipeline.
-	a `done` function that the plug-in should call when its processing is all finished -- if your plugin needs to run some asynchronous tasks, call this function only after they are all completed in order to tell typesmith that it is safe to move on to the next plugin in the chain.

You could simply create one inline, as follows:

```js
typesmith(config).use(readJson())
  .use(readMarkdown())
  .use(function(typesmith, done) {
    // your custom code goes here!
    done();
  })
```

or in a function in your module:

```js
var myPlugin = function(typesmith, done)
{
	// do whatever
	done();
}

typesmith(config).use(readJson())
  .use(readMarkdown())
  .use(myPlugin)
```

But usually we encapsulate each plug-in in its own module, so that it's more easily reusable:

```js
module.exports = plugin;

function plugin(opts) {

  var plugin_defaults = {};

  return function(typesmith, done){
    var config = Object.assign({}, plugin_defaults, typesmith.config['typesmith-your-plugin-name'], opts);

    // do your plugin stuff here!

	done();
  }
}
```

See the code of the plug-in modules listed above for working examples.
