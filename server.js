'use strict';

var argh = require('argh');
var bunyan = require('bunyan');
var levelup = require('levelup');
var pkgjson = require('./package.json');
var restify = require('restify');
var routes = require('./lib/routes');

var server = exports;

if (argh.argv.help || argh.argv.h) {
  console.log([
    'Usage: ./bin/' + pkgjson.name + ' [--port] [--loglevel] [--dbname]',
    'Starts ' + pkgjson.name + ' with the specified configuration',
    '--port port to run on (default: 9001)',
    '--loglevel log level (default: info)',
    '--dbname database name (default: db)'
  ].join('\n'));

  process.exit();
}

var APP_NAME = pkgjson.name.toUpperCase().replace('-', '_');
var opts = {
  'port': +(argh.argv.port || process.env[APP_NAME + '_PORT'] || '9001'),
  'loglevel': argh.argv.loglevel || process.env[APP_NAME + '_LOGLEVEL']  || 'info',
  'dbname': argh.argv.dbname || process.env[APP_NAME + '_DBNAME']  || 'db'
};

var dbPath = opts.dbname;
opts.leveldb = {
  path: dbPath,
  db: levelup(dbPath, {
    valueEncoding: 'json'
  })
};

var logger = bunyan.createLogger({
  name: pkgjson.name + '_log',
  level: opts.loglevel,
  stream: process.stdout,
  serializers: restify.bunyan.serializers
});

var restifyServer = restify.createServer({
  name: pkgjson.name,
  version: pkgjson.version,
  log: logger
});

server.restifyServer = restifyServer;

restifyServer.log.level('info');

restifyServer.use(require('./middleware/uuid'));
restifyServer.use(require('./middleware/api-version'));
restifyServer.use(require('./middleware/logger'));

restifyServer.use(restify.queryParser());
restifyServer.use(restify.bodyParser({
  mapParams: false
}));

server.run = function() {
  routes(restifyServer, opts);
  restifyServer.listen(opts.port, function() {
    restifyServer.log.info(pkgjson.name + ' is now running on port ' + opts.port);
    restifyServer.log.debug(opts);
  });
};

server.close = function(cb) {
  restifyServer.close(cb);
};

if (require.main === module) {
  console.log('Starting server');
  server.run();
}
