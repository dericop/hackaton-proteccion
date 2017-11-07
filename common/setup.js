/*
Bancolombia 2017
 */
'use strict';

const Cloudant = require('cloudant'),
  cfenv = require('cfenv'),
  DAOCloudant = require('../DAO');

function readConfiguration() {
  const mod = {
    module:'configuration'
  }; 
  return DAOCloudant.callOperation(mod);
}

function readMessages() {
  const mod = {
    module:'messages'
  }; 
  return DAOCloudant.callOperation(mod);
}

function readCert() {
  const mod = {
    module:'certs'
  }; 
  return DAOCloudant.callOperation(mod);
}

function setup() {
  return Promise.all([readConfiguration(), readMessages(), readCert()]);
}

module.exports = setup;