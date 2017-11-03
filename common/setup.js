/*
Bancolombia 2017
 */
'use strict';

const Cloudant = require('cloudant'),
  cfenv = require('cfenv'),
  DAOCloudant = require('../DAO');

let service = cfenv.getAppEnv().services['user-provided'].find(upsi => upsi.name === 'cloudantBOT');
let serviceCert = cfenv.getAppEnv().services['user-provided'].find(upsi => upsi.name === 'public_cert_controller_bot');

const cloudant = Cloudant(service.credentials),
  config_certs = cloudant.db.use('certs');

function readConfiguration() {
  const mod = {
    module:'configuration'
  }; 
  return DAOCloudant.callOperation(mod);
}

function readMessages() {
    let query = {
        selector: {
            docType: {
                $eq: "messages"
            }
        }
    };

    return new Promise((fulfill, reject) => {
        configDB.find(query, (err, data) => {
            if (err) {
              logger.error({
                  err: err
              }, 'Error in readMessages.');
              return reject(err);
            }
            let messages = {};
            data.docs.map(msg => {
              let current = {};
              Object.assign(current, msg);
              delete current._id;
              delete current._rev;
              delete current.docType;
              messages[msg._id.split('.')[1]] = current;
            });
            // Make it available globally
            global.__messages = messages;
            fulfill();
        });
    });
}

function readCert() {
  const APP_NAME = process.env.APP_NAME;
  const query = {
    selector: {
        name: {
            "$eq": APP_NAME
        }
    }
  };
  return new Promise((fulfill, reject) => {
    config_certs.find(query, (err, data) => {
      if (err) {
        logger.error("ERROR_CTR_BOT » common » setup ", `${JSON.stringify(err)}`);
        return reject(err);
      }
      let cert = {};
      data.docs.map(doc => {
        let current = {};
        Object.assign(current, doc);
        delete current._id;
        delete current._rev;
        cert = current;
      });
      let cert_publickey = JSON.parse(serviceCert.credentials.cert);
      let options = {
        senderCertificate: cert_publickey.public_key,
        selfPrivateKey: cert.privateKey,
      };
      global.__cert = options;
      fulfill();
    });
  });
}

function setup() {
  return Promise.all([readConfiguration()]);//, readMessages(), readCert()]);
}

module.exports = setup;