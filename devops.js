#!/usr/bin/env node

var path = require('path');
var pkg = require( path.join(__dirname, 'package.json') );
var ConfigStore = require('configstore');
var prompt = require('prompt');
var ServerPilot = require('serverpilot-node');
var chalk = require('chalk');

// Require our plugins
var devopsServerPilot = require('./lib/devops-serverpilot');
var devopsBitbucket = require('./lib/devops-bitbucket');

// Initialize ConfigStore to store config variables
var conf = new ConfigStore( pkg.name );

// Stub an initial command line program out
var program = require('commander');

// Set the version on the program
program
    .version(pkg.version);

// Enable our plugins
devopsServerPilot.set(program, conf);
devopsBitbucket.set(program, conf);

// Parse everything
program.parse(process.argv);

if ( ! program.args.length ) {
    program.help();
};