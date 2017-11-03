'use strict'
let config = null;

const getConfiguration = () => {
  if(config) {
    return new Promise.resolve(config);
  } else {
    return new Promise.reject(new Error('Error, no fue posible obtener la configuración desde la BD'));
  }
}

const _getConfigurationDB = (obj) => {
  const DB = obj.cloudant.db.use('configuration-sofy');
  const logger = obj.logger;
  let query = {
    selector: {
        docType: {
            $ne: "messages"
        }
    }
  }
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
        fulfill();
    });
  });
}

const setConfiguration = (configObj) => {
  config = configObj;
}

const init = (obj) => {
  return _getConfigurationDB(obj);
}

module.exports = {
  getConfiguration,
  init,
}