module.exports = function(api, cfg) {
  var r = require('../resources')(cfg);

  //
  // services
  //
  api.get('/services', r.service.list);
  api.post('/services', r.service.validate, r.service.create);
  api.get('/services/:name', r.service.get);
  api.del('/services/:name', r.service.del);
  api.get('/services/:name/config', r.service.getConfig);
  api.patch('/services/:name/config', r.service.validateConfigPatch, r.service.modifyConfig);
};
