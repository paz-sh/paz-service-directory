# paz-service-directory 

A directory of the services that can be run on the paz platform, along with their config. Produces systemd unit files for running on a CoreOS cluster with fleet.

API documentation can be found in `docs/api-blueprint.md`. You can view it by generating it with `npm run docs` and then serving with `npm run docs-server`.

## Tests

API functional tests can be found in `test/`.

To run on OS X (w/ Boot2Docker):
```
$ DOCKER_IP=192.168.59.103 npm test
```

Tun run on Linux etc.:
```
$ npm test
```
