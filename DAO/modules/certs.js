'use strict';

const cfenv = require('cfenv'),
  serviceCert = cfenv.getAppEnv().services['user-provided'].find(upsi => upsi.name === 'public_cert_controller_bot');

const _getConfigurationDB = (obj) => {
  const DB = obj.cloudant.db.use('certs-sofy');
  const APP_NAME = process.env.APP_NAME;
  const logger = obj.logger;
  const query = {
    selector: {
        name: {
            "$eq": APP_NAME
        }
    }
  };
  return new Promise((fulfill, reject) => {
    DB.find(query, (err, data) => {
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
};

const init = (obj) => {
  return _getConfigurationDB(obj);
};

module.exports = {
  init,
};