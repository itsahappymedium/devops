Define the main object
-
Load in the core plugins
- Keys
Load in the services
- ServerPilot
- BitBucket
- Google Analytics
- NameCheap
- CloudFlare
- Github
- Twitter
- DigitalOcean
Create functions to let users define plugins

name: serverpilot
commands: servers, apps, databases, users
actions: {
    name: create,
    handler: createServer
}