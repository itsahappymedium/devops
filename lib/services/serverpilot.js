var inquirer = require('inquirer');
var chalk = require('chalk');
var Table = require('cli-table');
var _ = require('lodash');
var ServerPilot = require('serverpilot-node');

module.exports.set = function( program, conf ) {

    // Set up the command
    program
        .command('serverpilot <command> [actions...]')
        .description('Execute a command within ServerPilot')
        .action(function(command, actions, options) {
            spcli = new ServerPilotCLI();
            spcli.process(command, actions);
        })
        .on('--help', function() {
            console.log();
            console.log('   Commands:');
            console.log('       status          Display general ServerPilot status');
            console.log('       servers         Display server statistics');
            console.log('       servers add     Add a new server');
            console.log('       servers delete  Delete a server');
            console.log('       apps            Display app statistics');
            console.log();
        });

    function ServerPilotCLI() {
        var config = {
            clientId: conf.get('SP_CLIENT_ID'),
            apiKey: conf.get('SP_API_KEY')
        };

        this.config = config;

        this.currentCommand = null;

        // Will contain our client
        this.sp;
    }

    ServerPilotCLI.prototype.process = function( command, actions ) {
        if ( ! this.config.clientId && this.config.apiKey ) {
            this.currentCommand = command;
            this.setup();

            return;
        }

        this.sp = new ServerPilot({
            clientId: this.config.clientId,
            apiKey: this.config.apiKey
        });

        // Line break at the top
        console.log();

        // If a command was specified, do it
        switch ( command ) {

            case 'apps':

                this.apps( actions );

                break;

            case 'servers':

                this.servers( actions );

                break;

            case 'setup':

                this.setup();

                break;

            default:
                // Show a general status
                console.log('The latest stats from your ServerPilot account:');
                console.log('');

                // Show server stats
                this.sp.getServers( function(err, data) {
                    console.log(chalk.cyan.bold('Number of Servers: ' + data.data.length));
                    console.log('');
                    for (var i = data.data.length - 1; i >= 0; i--) {
                        console.log(chalk.yellow('Name: ' + data.data[i].name));
                        console.log(chalk.magenta('IP: ' + data.data[i].lastaddress));
                        console.log('');
                    };
                });

                // Show app stats
                this.sp.getApps( function(err, data) {
                    console.log(chalk.cyan.bold('Number of Apps: ' + data.data.length));
                    console.log('');

                    var apps = data.data.map(function(app){ return app.name; });
                    apps = apps.join(', ');

                    console.log(chalk.magenta(apps));

                    // Line break at the bottom
                    console.log();
                });

                break;
        }
    }

    /**
     * Set up ServerPilot credentials
     * @return {void}
     */
    ServerPilotCLI.prototype.setup = function() {
        console.log('You haven\'t set up your credentials in ServerPilot yet. Let\'s do that now.');

        var promptItems = [{
            name: 'SP_CLIENT_ID',
            message: 'Enter your ServerPilot Client ID',
            default: this.config.clientId ? this.config.clientId : ''
        },
        {
            name: 'SP_API_KEY',
            message: 'Enter your ServerPilot API Key',
            default: this.config.apiKey ? this.config.apiKey : ''
        }];

        inquirer.prompt( promptItems, function(result) {
            conf.set('SP_CLIENT_ID', result.SP_CLIENT_ID);
            this.config.clientId = result.SP_CLIENT_ID;

            conf.set('SP_API_KEY', result.SP_API_KEY);
            this.config.apiKey = result.SP_API_KEY;

            // If we were in middle of a command, pick it up again
            if ( this.currentCommand ) {
                this.process(currentCommand);
                this.currentCommand = null;
            }
        }.bind(this));
    }

    /**
     * Handle all server commands
     * @param  {array} actions Actions passed through
     * @return {void}
     */
    ServerPilotCLI.prototype.servers = function( actions ) {

        /**
         * Add a server by name
         * @param {string} name Name
         */
        function createServer(spcli, name) {
            console.log();
            console.log('Attempting to add a server named "' + name + '"...');
            console.log();

            spcli.sp.createServer(name, function(err, data) {
                if (err) {
                    console.log(chalk.red.bold('Error: ' + err.message));
                } else {
                    console.log(chalk.green.bold('Successfully added a server named ' + name));
                }

                console.log();
                process.exit(0);
            });
        }

        /**
         * Delete a server
         * @param  {object} spcli    this
         * @param  {string} serverId Server ID
         * @return {void}
         */
        function deleteServer(spcli, server) {
            console.log();
            console.log('Attempting to delete the server ' + server.name + '...');
            console.log();

            spcli.sp.deleteServer(server.id, function(err, data) {
                if (err) {
                    console.log(chalk.red.bold('Error: ' + err.message));
                } else {
                    console.log(chalk.green.bold('Successfully deleted server ' + server.name));
                }
            });
        }

        /**
         * Do an action based on the actions passed in
         */

        if ( ! actions.length ) {
            // Show server stats
            this.sp.getServers( function(err, data) {
                console.log(chalk.cyan.bold('Number of Servers: ' + data.data.length));
                console.log();
                for (var i = data.data.length - 1; i >= 0; i--) {
                    console.log(chalk.yellow('Name: ' + data.data[i].name));
                    console.log(chalk.magenta('IP: ' + data.data[i].lastaddress));
                    console.log();
                };

                // Line break at the bottom
                console.log();
                process.exit(0);
            });
        } else {
            // Grab the first argument
            var action = actions[0];

            switch (action) {

                /**
                 * Create a server
                 */
                case 'create':
                    var serverName;

                    if ( actions.length > 1 ) {
                        serverName = actions[1];
                        createServer(this, serverName);

                    } else {
                        // Get the server name
                        inquirer.prompt([{
                            name: 'serverName',
                            message: 'Enter the desired name of your server'
                        }], function(result) {
                            var serverName = result.serverName;
                            createServer(this, serverName);
                        }.bind(this));
                    }

                    break;

                /**
                 * Delete a server
                 */
                case 'delete':
                    var serverName;

                    if ( actions.length > 1 ) {
                        serverName = actions[1];
                        deleteServer(this, serverName);
                    } else {
                        var serverChoices = [];
                        // Potential serverNames
                        this.sp.getServers(function(err, data) {
                            _.each(data.data, function(server) {
                                serverChoices.push({
                                    name: server.name,
                                    value: server
                                });
                            });

                            inquirer.prompt({
                                type: 'list',
                                choices: serverChoices,
                                name: 'server',
                                message: 'Select the server you\'d like to delete.'
                            }, function(result) {

                                var serverToDelete = result.server;

                                // Confirm deletion
                                inquirer.prompt({
                                    type: 'confirm',
                                    name: 'deleteServer',
                                    message: 'Are you sure you want to delete server ' + result.server.name + '?'
                                }, function(result) {
                                    if ( result.deleteServer ) {
                                        deleteServer(this, serverToDelete);
                                    }
                                }.bind(this));
                            }.bind(this));
                        }.bind(this));
                    }

                    break;

                case 'default':
                    console.log('Unrecognized: ' + action);
                    program.help();

                    break;
            }
        }
    }

    /**
     * Handle all requests regarding apps
     * @param  {array} actions Array of actions from the CLI
     * @return {this}
     */
    ServerPilotCLI.prototype.apps = function( actions ) {

        function showApps(spcli) {
            spcli.sp.getApps(function(err, data) {
                if ( err ) {
                    console.log(chalk.red.bold('Error: ' + err.message));
                } else {
                    console.log(chalk.cyan.bold('Total apps: ' + data.data.length));
                    console.log();
                    var table = new Table({
                        head: ['Name', 'Server ID', 'Domains'],
                        colWidths: [15, 10, 25]
                    });

                    data.data.map(function(app) {
                        table.push([ app.name, app.serverid, app.domains ]);
                    })

                    console.log(table.toString());
                    console.log();
                }
            });
        }

        if ( ! actions.length ) {
            showApps(this);
        } else {

            var action = actions[0];

            switch (action) {
                case 'create':
                    console.log();
                    console.log('Create an app');
                    console.log();

                    var appName,
                        servers,
                        serverToUse;

                    inquirer.prompt({
                        name: 'appName',
                        message: 'Please name your app'
                    }, function(result) {
                        appName = result.appName;

                        this.sp.getServers(function(err, data) {
                            if ( err ) {
                                console.log(err.message);
                            } else {
                                servers = data.data;

                                var serverChoices = [];
                                _.each(servers, function(server) {
                                    serverChoices.push({
                                        name: server.name,
                                        value: server
                                    });

                                    inquirer.prompt({
                                        name: 'server',
                                        message: 'To which server would you like to add your app?',
                                        type: 'list',
                                        choices: serverChoices
                                    }, function(result) {
                                        createApp(this, appName, result.server);
                                    }.bind(this));
                                }.bind(this));
                            }
                        }.bind(this));
                    }.bind(this));

                    break;

                case 'delete':

                    break;

                default:

                    break;
            }
        }

        return this;
    }
}