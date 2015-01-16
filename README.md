# node-pg-spice

Monkey patch to add sugar and spice to [node-postgres](https://github.com/brianc/node-postgres) (the [node.js](http://nodejs.org/) [PostgreSQL](http://www.postgresql.org/) client).

__NOTE:__ See the module [pg-db](https://github.com/sehrope/node-pg-db) for a more extensive library that supports named parameters, transactions, and more without requiring monkey patching.

# Installation

Add it to your node.js project via:

    npm install pg-spice --save

# Usage

To patch your node-postgres module add the following to the start of your app:

    var pg = require('pg');
    require('pg-spice').patch(pg);

As pg-spice modifies the `pg.Client` prototype this need only be done once at the beginning of your application. Any uses of the pg module elsewhere will also benefit from it.

# Features

## Named Parameters

pg-spice extends `pg.Client.query(config, values, cb)` to allow for using named parameters. To use it simply pass an object as the second paramater (the `values` field). Any other calls will be proxied to the original function.

The SQL parsing for named parameters is done in a single pass and includes ignoring of otherwise valid named parameters in comments (both multi-line `/* ... */` and single-line `-- ...` styles), strings (single quotes), and quoted identifiers (double quotes).

### Why Use Named Parameters?

SQL with named parameters is more readable than SQL with positional parameters (i.e. `$1`, `$2`, ...).

Also, with named parameters it's possible to pass your existing model objects as the parameter itself rather than breaking down the individual fields into an array.

### Why isn't this part of the node-postgres client?

The node-postgres client matches up with the PostgreSQL server protocol itself which only supports numbered params. Named parameters are traditionally provided at the client layer.

### Examples

A basic select:

    // Classic style with positional parameters:
    client.query('SELECT * FROM my_table WHERE foo = $1'
               , ['val']
               , function(err, result) { /* do something */ });

    // Same query with named parameters:
    client.query('SELECT * FROM my_table WHERE foo = :bar'
               , {bar: 'val'}
               , function(err, result) { /* do something */ });

A more complicated insert:

    // Classic style with positional parameters:
    client.query('INSERT INTO user'
                  + ' (id, name, email, password_hash)'
                  + ' VALUES '
                  + ' ($1, $2, $3, $4)'
               , [1, 'alice', 'alice@example.org', hash('t0ps3cret')]
               , function(err, result) { /* do something */ });

    // Same query with named parameters:
    client.query('INSERT INTO user'
                  + ' (id, name, email, password_hash)'
                  + ' VALUES '
                  + ' (:id, :name, :email, :passwordHash)'
               , {id: 1, name: 'alice', email: 'alice@example.org', passwordHash: hash('t0ps3cret')}
               , function(err, result) { /* do something */ });

Another example with a model object:

    var widget = {
      id: 12345,
      name: 'My Widget',
      type: 'xg17',
      owner: 'me@example.org'
    };

    // Classic style with positional parameters:
    client.query('INSERT INTO widgets'
                  + ' (id, name, type, owner)'
                  + ' VALUES '
                  + ' ($1, $2, $3, $4)'
               , [widget.id, widget.name, widget.type, widget.owner]
               , function(err, result) { /* do something */ });
    
    // Same query with named parameters:
    client.query('INSERT INTO widgets'
                  + ' (id, name, type, owner)'
                  + ' VALUES '
                  + ' (:id, :name, :type, :owner)'
               // We can just pass in the object as is:
               , widget
               , function(err, result) { /* do something */ });


### Repeated Parameters

PostgreSQL allows you to specify the same parameter multiple times in the same SQL command. For example:

    SELECT $1, foo FROM bar WHERE bam = $1

pg-spice allows you to do the same with named parameters. The previous example could be rewritten as (note that `:bam` is repeated):

    SELECT :bam, foo FROM bar WHERE bam = :bam

### Named Parameter Formats

pg-spice supports the following types of named parameters:

* `:foo`

        SELECT * FROM my_table WHERE foo = :foo

* `:{foo}`

        SELECT * FROM my_table WHERE foo = :{foo}
* `$foo`

        SELECT * FROM my_table WHERE foo = $foo

By default pg-spice will throw an error if you mix multiple types of parameters in single SQL statement. For example by default you can't (and shouldn't!) do: `SELECT :foo, :{bar}`

It will also throw an error if you mix named and numbered parameters in the same SQL statement as it would not make any sense. For example you can't (and shouldn't!) do: `SELECT :foo, $2`

### Caching

By default the translated SQL is cached so repeated calls with the same named parameter SQL will not require reparsing the SQL. This can be overridden via the `enableParseCache` option.

## Debug SQL Logging

pg-spice uses the [debug](https://github.com/visionmedia/debug) package for logging. By default all logging is disabled.

The SQL for all calls to `pg.Client.query(...)` is optionally logged to a debug sub logger named `pg-spice:sql`. This works for both named parameters and numbered parameters.

To display the SQL execute your node.js program like this:

    DEBUG=pg-spice:sql node foo.js

Then a file such as foo.js:

    client.query("SELECT * FROM my_table WHERE some_thing = 'foobar'", [], function(err, result) {
      /* do something */
    });

Would output:

    pg-spice:sql SELECT * FROM my_table WHERE some_thing = 'foobar' +0ms

# Options

You can override the default options by passing in a second parameter to the patch function:

    var pg = require('pg');
    require('pg-spice').patch(pg, {enableParseCache: false});

## Available options

* `enableParseCache` - Whether to cache parsed SQL between calls.

    Defaults to __true__. 
* `allowMultipleParamTypes` - Whether to allow multiple types of parameters in the same SQL statement.

     Defaults to __false__.
* `trimDebugSql` - Whether to trim whitespace from executed SQL before logging it. This will only effect logging, not the actual SQL that is executed. Newlines and other whitespace will be reduced to a single space.

    If you use multi-line SQL (*ex: via "here docs" in CoffeeScript*) then this will make it easier to read the debug SQL lines as they will appear on a single line.

    Alternatively you can also set it by setting the environment variable `PG_SPICE_TRIM_DEBUG_SQL` to `true`. All other values are considered false.

    Defaults to __false__.

# Support

If at all possible when you open an issue please provide

* version of node
* version of postgres
* version of node-postgres
* smallest possible snippet of code to reproduce the problem

Ideally I'd like pg-spice to not interfere at all with regular usage of node-postgres. If it does or you run in to a SQL command that is not parsed properly please let me know!

# Dependencies

* [lodash](http://lodash.com/)
* [debug](https://github.com/visionmedia/debug)

# Production Use
* [JackDB](https://www.jackdb.com/)

*If you use pg-spice in production and would like your site listed here, fork & add it.*

# License

This plugin is released under the MIT license. See the file [LICENSE](LICENSE).