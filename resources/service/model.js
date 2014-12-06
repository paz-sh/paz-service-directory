var joi = require('joi');
var override = require('json-override');
var schema = require('./schema');
var writeAllowed = schema.write;
var configPatchAllowed = schema.configPatch;
var _Error = require('error-plus');

module.exports = function Service(cfg) {
  var db = cfg.leveldb.db;
  var service = {};

  service.validate = function(body, uuid, cb) {
    joi.validate(body, writeAllowed, function(err) {
      if (!err) {
        return cb(null);
      }

      return cb(new _Error(err.message, {
        statusCode: 400,
        uuid: uuid
      }));
    });
  };

  service.validateConfigPatch = function(body, uuid, cb) {
    joi.validate(body, configPatchAllowed, function(err) {
      if (!err) {
        return cb(null);
      }

      return cb(new _Error(err.message), {
        statusCode: 400,
        uuid: uuid
      });
    });
  };

  service.get = function(id, meta, cb) {
    db.get('service!' + id, function(err, doc) {
      if (err) {
        if (err.notFound) {
          return cb(new _Error(err, {
            statusCode: 404,
            message: err.message
          }));
        }
        else {
          return cb(new _Error(err, {
            statusCode: 500,
            message: err.message
          }));
        }
      }
      if (doc) {
        return cb(null, {
          doc: doc
        });
      }
    });
  };

  service.list = function(params, meta, cb) {
    var services = [];
    if (params.dockerRepository) {
      // do lookup for service by dockerRepository
      db.get('dockerRepository!' + encodeURIComponent(params.dockerRepository),
        function(err, serviceKey) {
          if (err) {
            if (err.notFound) {
              return cb(new _Error(err, {statusCode: 404}));
            }
            else {
              return cb(new _Error(err, {statusCode: 500}));
            }
          }
          else {
            db.get(serviceKey, function(err, doc) {
              if (err && err.notFound) {
                return cb(new _Error(err, {statusCode: 404}));
              }
              else if (err) {
                return cb(new _Error(err, {statusCode: 500}));
              }
              return cb(null, {
                doc: doc
              });
            });
          }
        });
    }
    else {
      db.createReadStream({
        start: 'service!',
        end: 'service!\xff'
      })
      .on('data', function(data) {
        services.push(data.value);
      })
      .on('error', function(err) {
        // XXX will err be a string and therefore needs to be wrapped in an Error?
        return cb(err);
      })
      .on('close', function() {
        return cb(null, {
          doc: services
        });
      });
    }
  };

  service.create = function(meta, object, cb) {
    db.get('service!' + object.name, function(err) {
      if (err && err.notFound) {
        // only the base keys go in root of object, rest is config, gaps filled by pazDefaults
        var baseKeys = ['name', 'description', 'dockerRepository'];
        var doc = {};

        baseKeys.forEach(function(key) {
          doc[key] = object[key];
          delete object[key];
        });

        var defaults = {
          publicFacing: false,
          numInstances: 1,
          ports: [],
          env: {}
        };

        doc.config = override(defaults, object, true);

        var dbKey = 'service!' + doc.name;
        var puts = [
          {
            type: 'put',
            key: dbKey,
            value: doc
          },
          {
            type: 'put',
            key: 'dockerRepository!' + encodeURIComponent(doc.dockerRepository),
            value: dbKey
          }
        ];

        db.batch(puts, function(err) {
          if (err) {
            return cb(new _Error(
              'Error putting resource',
              {
                statusCode: 500,
                uuid: meta.uuid
              }));
          }
          return cb(null, {
            doc: doc
          });
        });
      } else if (err) {
        return cb(new _Error(
          'Error putting resource',
          {
            statusCode: 500,
            uuid: meta.uuid
          }));
      }
      else {
        return cb(new _Error(
          'Error putting resource: a service by that name already exists',
          {
            statusCode: 400,
            uuid: meta.uuid
          }));
      }
    });
  };

  service.modifyConfig = function(id, meta, object, cb) {
    db.get('service!' + id, function(err, doc) {
      if (err && err.notFound) {
        return cb(new _Error(
          'Cannot modify service config, a service by that name doesn\'t exist.',
          {
            statusCode: 404,
            uuid: meta.uuid
          }));
      }

      doc.lastModifiedTime = Date.now();

      Object.keys(object).forEach(function(key) {
        doc.config[key] = object[key];
      });
      db.put('service!' + id, doc, function(err) {
        if (err) {
          return cb(new _Error(
            'Error putting resource',
            {
              statusCode: 500,
              uuid: meta.uuid
            }));
        }

        return cb(null, {
          doc: doc.config
        });
      });
    });
  };

  service.del = function(id, meta, cb) {
    var dbKey = 'service!' + id;
    db.get(dbKey, function(err, doc) {
      if (err) {
        return cb(err.notFound ?
            new _Error('Resource not found', {
              statusCode: 404,
              uuid: meta.uuid
            }) :
            new _Error('Error deleting resource', {
              statusCode: 500,
              uuid: meta.uuid
            }));
      }
      var dels = [
        {
          type: 'del',
          key: dbKey
        },
        {
          type: 'del',
          key: 'dockerRepository!' + encodeURIComponent(doc.dockerRepository)
        }
      ];
      db.batch(dels, function(err) {
        if (err) {
          return cb(err.notFound ?
              new _Error('Resource not found', {
                statusCode: 404,
                uuid: meta.uuid
              }) :
              new _Error('Error delete resource', {
                statusCode: 500,
                uuid: meta.uuid
              }));
        }

        return cb(null);
      });
    });
  };

  service.getConfig = function(id, meta, cb) {
    db.get('service!' + id, function(err, doc) {
      if (err) {
        if (err.notFound) {
          return cb(new _Error(err, {
            statusCode: 404,
            message: err.message
          }));
        }
        else {
          return cb(new _Error(err, {
            statusCode: 500,
            message: err.message
          }));
        }
      }
      if (doc) {
        return cb(null, {
          doc: doc.config
        });
      }
    });
  };

  return service;
};
