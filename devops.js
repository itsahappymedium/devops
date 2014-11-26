#!/usr/bin/env node

var path = require('path');
var pkg = require( path.join(__dirname, 'package.json') );
var ConfigStore = require('configstore');

// Initialize ConfigStore to store config variables
var conf = new ConfigStore( pkg.name );

// Stub an initial command line program out
var program = require('commander');

// Set the version on the program
program
    .version(pkg.version);

// Require and initialize all plugins inside /lib/
var normalizedPath = path.join(__dirname, 'lib');
require('fs').readdirSync(normalizedPath).forEach(function(file) {
    var service = require('./lib/' + file);
    service.set(program, conf);
});

// Parse everything
program.parse(process.argv);

if ( ! program.args.length ) {
    program.help();
};