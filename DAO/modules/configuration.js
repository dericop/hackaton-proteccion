'use strict';

let config = null;

const getConfiguration = () => {
  return config;
};

const _getConfigurationDB = (obj) => {
  const DB = obj.cloudant.db.use('configuration-sofy');
  const logger = obj.logger;
  let query = {
    selector: {
        docType: {
            $ne: "messages"
        }
    }
  };
  return new Promise((fulfill, reject) => {
    DB.find(query, (err, data) => {
        if (err) {
            logger.error({
                err: err
            }, 'Error in readConfiguration.');
            return reject(err);
        }
        let config = {};
        data.docs.map(doc => {
            let current = {};
            Object.assign(current, doc);
            delete current._id;
            delete current._rev;
            delete current.docType;
            config[doc._id] = current;
        });
        setConfiguration(config);
        global.__configuration = config;
        fulfill();
    });
  });
};

const setConfiguration = (configObj) => {
  config = configObj;
};

const init = (obj) => {
  return _getConfigurationDB(obj);
};

module.exports = {
  getConfiguration,
  init,
};