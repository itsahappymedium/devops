var prompt = require('prompt');
var ServerPilot = require('serverpilot-node');
var chalk = require('chalk');

module.exports.set = function( program, conf ) {

    // Set up the command
    program
        .command('serverpilot [command]')
        .description('Execute a command within ServerPilot')
        .action(function(command, options) {
            sp = new ServerPilotCLI();
            sp.process(command);
        })
        .on('--help', function() {
            console.log();
            console.log('   Commands:');
            console.log('       <blank>     Display general ServerPilot statistics');
            console.log('       servers     Display server statistics');
            console.log('       apps        Display app statistics');
            console.log();
        });

    function ServerPilotCLI() {
        var config = {
            clientId: conf.get('SP_CLIENT_ID'),
            apiKey: conf.get('SP_API_KEY')
        };

        this.config = config;

        this.currentCommand = null;
    }

    ServerPilotCLI.prototype.process = function( command ) {
        if ( ! this.config.clientId && this.config.apiKey ) {
            this.currentCommand = command;
            this.setup();

            return;
        }

        var sp = new ServerPilot({
            clientId: this.config.clientId,
            apiKey: this.config.apiKey
        });

        // Line break at the top
        console.log();

        // If a command was specified, do it
        switch ( command ) {

            case 'apps':

                // Show app stats
                sp.getApps( function(data) {
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

                // Show server stats
                sp.getServers( function(data) {
                    console.log(chalk.cyan.bold('Number of Servers: ' + data.data.length));
                    console.log();
                    for (var i = data.data.length - 1; i >= 0; i--) {
                        console.log(chalk.yellow('Name: ' + data.data[i].name));
                        console.log(chalk.magenta('IP: ' + data.data[i].lastaddress));
                        console.log();
                    };

                    // Line break at the bottom
                    console.log();
                });

                break;

            case 'setup':

                this.setup();

                break;

            default:
                // Show a general status
                console.log('The latest stats from your ServerPilot account:');
                console.log('');
                var sp = new ServerPilot({
                    clientId: this.config.clientId,
                    apiKey: this.config.apiKey
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
}