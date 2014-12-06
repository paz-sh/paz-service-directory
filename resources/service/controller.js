module.exports = function(cfg) {
  var controller = {};
  var service = require('./model')(cfg);

  controller.validate = function(req, res, next) {
    service.validate(req.body, req._uuid, function(err) {
      if (err) {
        res.send(err.statusCode, err);
      }
      else {
        next();
      }
    });
  };

  controller.validateConfigPatch = function(req, res, next) {
    service.validateConfigPatch(req.body, req._uuid, function(err) {
      if (err) {
        res.send(err.statusCode || 500, err);
      }
      else {
        next();
      }
    });
  };

  controller.get = function(req, res) {
    req.log.info({
      'service.get': req.params.name,
      'uuid': req._uuid
    });

    service.get(req.params.name,
        {
          uuid: req._uuid
        },
        function(err, response) {
          if (err) {
            res.send(err.statusCode || 500, err.message);
          }
          else {
            res.send(response ? 200 : 404, response);
          }
        });
  };

  controller.list = function(req, res) {
    req.log.info({
      'service.get': '*',
      'params': req.query,
      'uuid': req._uuid
    });

    service.list(req.query,
        {
          uuid: req._uuid
        },
        function(err, response) {
          if (err) {
            res.send(err.statusCode || 500, err.message);
          }
          else {
            res.send(200, response);
          }
        });
  };

  controller.create = function(req, res) {
    req.log.info({
      'service.create':'*',
      'uuid': req._uuid
    });

    service.create({
      uuid: req._uuid
    },
    req.body,
    function(err, response) {
      if (err) {
        res.send(err.statusCode || 500, err.message);
      }
      else {
        res.send(201, response);
      }
    });
  };

  controller.modifyConfig = function(req, res) {
    req.log.info({
      'service.modifyConfig': req.params.name,
      'uuid': req._uuid
    });

    service.modifyConfig(req.params.name,
    {
      uuid: req._uuid
    },
    req.body,
    function(err, response) {
      if (err) {
        res.send(err.statusCode, err.message);
      }
      else {
        res.send(200, response);
      }
    });
  };

  controller.del = function(req, res) {
    req.log.info({
      'service.delete': req.params.name,
      'uuid': req._uuid
    });

    service.del(req.params.name, {
      uuid: req._uuid
    },
    function(err) {
      if (err) {
        res.send(err.statusCode, err.message);
      }
      else {
        res.send(204);
      }
    });
  };

  controller.getConfig = function(req, res) {
    req.log.info({
      'service.getConfig': req.params.name,
      'uuid': req._uuid
    });

    service.getConfig(req.params.name,
        {
          uuid: req._uuid
        },
        function(err, response) {
          if (err) {
            res.send(err.statusCode, err.message);
          } else {
            res.send(200, response);
          }
        });
  };

  return controller;
};
