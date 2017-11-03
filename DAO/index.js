'use strict'

const Cloudant = require('cloudant'),
  cfenv = require('cfenv')
  Logger = require('../common/logging');

let service = cfenv.getAppEnv().services['user-provided'].find(upsi => upsi.name === 'cloudantBOT');
let serviceCert = cfenv.getAppEnv().services['user-provided'].find(upsi => upsi.name === 'public_cert_controller_bot');

const cloudant = Cloudant(service.credentials);
const logger = new Logger({});

const callOperation = (obj) => {
  const cloud = {
    cloudant,
    logger
  };
  return require(`./modules/${obj.module}`).init(cloud);
}

module.exports = {
  callOperation,
}