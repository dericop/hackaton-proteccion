'use strict';

const _getConfigurationDB = (obj) => {
  const DB = obj.cloudant.db.use('configuration-sofy');
  const logger = obj.logger;
  let query = {
    selector: {
        docType: {
            $eq: "messages"
        }
    }
  };

return new Promise((fulfill, reject) => {
  DB.find(query, (err, data) => {
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
};

const init = (obj) => {
  return _getConfigurationDB(obj);
};

module.exports = {
  init,
};