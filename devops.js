#!/usr/bin/env node

var path = require('path');
var pkg = require( path.join(__dirname, 'package.json') );
var ConfigStore = require('configstore');
var prompt = require('prompt');
var ServerPilot = require('serverpilot-node');
var chalk = require('chalk');

// Initialize ConfigStore to store config variables
var conf = new ConfigStore( pkg.name );

var program = require('commander');

program
    .version(pkg.version)
    .usage('<service> <command>')
    .option('-p, --port <port>', 'Port blah blah', parseInt)
    .parse(process.argv);

if ( ! program.args.length ) {
    program.help();
} else {
    switch ( program.args[0] ) {

        case 'serverpilot':
            if ( ! conf.get('SP_CLIENT_ID') && conf.get('SP_API_KEY') ) {
                setUpServerPilot();
            }

            // If a command was specified, do it
            if ( program.args.length > 1 ) {
                var command = program.args[1];

                // Do something
            } else {
                // Show a general status
                console.log('');
                console.log('The latest stats from your ServerPilot account:');
                console.log('');
                var sp = new ServerPilot({
                    clientId: conf.get('SP_CLIENT_ID'),
                    apiKey: conf.get('SP_API_KEY')
                });

                // Show server stats
                sp.getServers( function(data) {
                    console.log(chalk.cyan.bold('Number of Servers: ' + data.data.length));
                    console.log('');
                    for (var i = data.data.length - 1; i >= 0; i--) {
                        console.log(chalk.yellow('Name: ' + data.data[i].name));
                        console.log(chalk.magenta('IP: ' + data.data[i].lastaddress));
                        console.log('');
                    };
                });

                // Show app stats
                sp.getApps( function(data) {
                    console.log(chalk.cyan.bold('Number of Apps: ' + data.data.length));
                    console.log('');

                    var apps = data.data.map(function(app){ return app.name; });
                    apps = apps.join(', ');

                    console.log(chalk.magenta(apps));
                    console.log('');
                });
            }
    }
}

/**
 * Set up ServerPilot credentials
 * @return {void}
 */
function setUpServerPilot() {
    console.log('You haven\'t set up your credentials in ServerPilot yet. Let\'s do that now.');

    prompt.start();

    var promptItems = [{
        name: 'SP_CLIENT_ID',
        description: 'Enter your ServerPilot Client ID',
        default: conf.get('SP_CLIENT_ID') ? conf.get('SP_CLIENT_ID') : ''
    },
    {
        name: 'SP_API_KEY',
        description: 'Enter your ServerPilot API Key',
        default: conf.get('SP_API_KEY') ? conf.get('SP_API_KEY') : ''
    }];

    prompt.get( promptItems, function(err, result) {
        conf.set('SP_CLIENT_ID', result.SP_CLIENT_ID);
        conf.set('SP_API_KEY', result.SP_API_KEY);
    })
}