'use strict';

const Cloudant = require('cloudant'),
  Logger = require('../common/logging');

const password = process.env.cloudant_password;
const user = process.env.cloudant_user;
const cloudant_account = process.env.cloudant_account;;


const cloudant = Cloudant({account:cloudant_account,username:user, password:password});
const logger = new Logger({});

const callOperation = (obj) => {
  const cloud = {
    cloudant,
    logger
  };
  return require(`./modules/${obj.module}`).init(cloud);
};

module.exports = {
  callOperation,
};