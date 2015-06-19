var joi = require('joi');

var schema = {
  name: joi.string().min(3),
  description: joi.string(),
  dockerRepository: joi.string(),
  publicFacing: joi.boolean(),
  ports: joi.array().includes(
    joi.object().keys({
      container: joi.number().integer().required(),
      host: joi.number().integer()
    })),
  env: joi.object(),
  volume: joi.object(),
  numInstances: joi.number().integer().min(1)
};

module.exports = {
  write: {
    name: schema.name.required(),
    description: schema.description,
    dockerRepository: schema.dockerRepository.required(),
    publicFacing: schema.publicFacing,
    ports: schema.ports,
    env: schema.env,
    volume: schema.volume,
    numInstances: schema.numInstances
  },
  patch: {
    name: schema.name,
    description: schema.description,
    dockerRepository: schema.dockerRepository
  },
  configPatch: {
    publicFacing: schema.publicFacing,
    ports: schema.ports,
    env: schema.env,
    volume: schema.volume,
    numInstances: schema.numInstances
  }
};
