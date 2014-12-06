module.exports = function(cfg) {
  return {
    service: require('./service/controller')(cfg)
  };
};
