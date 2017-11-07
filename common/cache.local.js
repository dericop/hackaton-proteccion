/*
Bancolombia 2017
 */

'use strict';

var mapa = new Map();

var mc = {
    get: function (id, cbk) {
        let result = mapa.get(id) || {};
        cbk(null, JSON.stringify(result));
    },
    set: function (id, data, cbk) {
        cbk(null, mapa.set(id, JSON.parse(data)));
    }
};

function getContext(id) {
    return new Promise((fulfill, reject) => {
        mc.get(id, (err, value) => {
            if (err)
                return reject(err);
            let context = JSON.parse(value);
            if (!context) {
                context = {};
            }
            fulfill(context);
        });
    });
}

function get(id) {
  return new Promise((fulfill, reject) => {
      mc.get(id, (err, value) => {
          if (err)
              return reject(err);
          fulfill(JSON.parse(value));
      });
  });
}

function set(id, data, timeout) {
  return new Promise((fulfill, reject) => {
      let copy = {};
      Object.assign(copy, data);
      delete copy.logger;
      delete copy.save;
      mc.set(id, JSON.stringify(copy), (err, success) => {
          if (err) {
              return reject(err);
          }
          fulfill(success);
      }, timeout);
  });
}

module.exports = {
    get,
    getContext,
    set
};