var prompt = require('prompt');
var chalk = require('chalk');
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

        prompt.start();

        var promptItems = [{
            name: 'SP_CLIENT_ID',
            description: 'Enter your ServerPilot Client ID',
            default: this.config.clientId ? this.config.clientId : ''
        },
        {
            name: 'SP_API_KEY',
            description: 'Enter your ServerPilot API Key',
            default: this.config.apiKey ? this.config.apiKey : ''
        }];

        prompt.get( promptItems, function(err, result) {
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

    ServerPilotCLI.prototype.servers = function( actions ) {

        /**
         * Add a server by name
         * @param {string} name Name
         */
        function createServer(spcli, name) {
            console.log();
            console.log('Attempting to add a server named "' + serverName + '"...');
            console.log();

            spcli.sp.createServer(serverName, function(err, data) {
                if (err) {
                    console.log(chalk.red.bold('Error: ' + err.message));
                } else {
                    console.log(chalk.green.bold('Successfully added a server named ' + serverName));
                }

                console.log();
                process.exit(0);
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
                        prompt.start();

                        prompt.get({
                            name: 'serverName',
                            description: 'Enter the desired name of your server'
                        }, function(err, result) {
                            var serverName = result.serverName;

                            createServer(this, serverName);
                        }.bind(this));
                    }

                    break;



                case 'default':
                    program.help();

                    break;
            }
        }
    }
}