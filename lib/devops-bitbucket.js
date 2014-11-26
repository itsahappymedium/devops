var prompt = require('prompt');
var chalk = require('chalk');
var Table = require('cli-table');
var BitBucket = require('bitbucket-api');

module.exports.set = function( program, conf ) {

    // Set up the command
    program
        .command('bitbucket [command]')
        .description('Execute a command within BitBucket')
        .action(function(command, options) {
            bb = new BitBucketCLI();
            bb.process(command);
        })
        .on('--help', function() {
            console.log();
            console.log('   Commands:');
            console.log('       <blank>     Display general statistics');
            console.log('       repos       Display repository statistics');
            console.log();
        });

    function BitBucketCLI() {
        var config = {
            username: conf.get('BB_USERNAME'),
            password: conf.get('BB_PASSWORD')
        };

        this.config = config;

        this.currentCommand = null;
    }

    BitBucketCLI.prototype.process = function( command ) {
        if ( typeof this.config.username === 'undefined'
        || typeof this.config.password === 'undefined' ) {
            this.currentCommand = command;
            this.setup();

            return;
        }

        var client = BitBucket.createClient({
            username: this.config.username,
            password: this.config.password
        })

        // Line break at the top
        console.log();

        // If a command was specified, do it
        switch ( command ) {

            case 'repos':

                // Show app stats
                client.repositories( function(err, data) {
                    if ( err ) {
                        console.log(chalk.red.bold('An error occurred: ' + err));
                        return false;
                    } else {
                        console.log(chalk.cyan.bold('Total Repositories: ' + data.length));
                    }

                    console.log();

                    var table = new Table({
                        head: ['Owner', 'Slug', 'Description'],
                        colWidths: [25, 25, 50]
                    });

                    var repos = data.map(function(repo){
                        table.push([repo.owner, repo.name, repo.description]);
                    });

                    console.log(table.toString());

                    // Line break at the bottom
                    console.log();
                });

                break;

            case 'setup':

                this.setup();

                break;

            default:
                // Show a general status
                console.log('The latest stats from your BitBucket account:');
                console.log('');

                // Show app stats
                client.repositories( function(err, data) {

                    if ( err ) {
                        console.log(chalk.red.bold('An error occurred: ' + err));
                    } else {
                        console.log(chalk.cyan.bold('Total Repositories: ' + data.length));
                    }

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
    BitBucketCLI.prototype.setup = function() {
        console.log('You haven\'t set up your credentials for BitBucket yet. Let\'s do that now.');

        prompt.start();

        var promptItems = [{
            name: 'BB_USERNAME',
            description: 'Enter your BitBucket username',
            default: this.config.username ? this.config.username : '',
            required: true
        },
        {
            name: 'BB_PASSWORD',
            description: 'Enter your BitBucket password',
            default: this.config.password ? this.config.password : '',
            hidden: true,
            required: true
        }];

        prompt.get( promptItems, function(err, result) {
            conf.set('BB_USERNAME', result.BB_USERNAME);
            this.config.username = result.BB_USERNAME;

            conf.set('BB_PASSWORD', result.BB_PASSWORD);
            this.config.password = result.BB_PASSWORD;

            // If we were in middle of a command, pick it up again
            if ( this.currentCommand ) {
                this.process(currentCommand);
                this.currentCommand = null;
            }
        }.bind(this));
    }
}