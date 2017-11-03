'use strict'
moment = require('moment');

const getDateWithTimeZone = () => {
  return moment().utcOffset('-0500').format('YYYY-MM-DDTHH:mm:ss.SS ZZ').toString();
}


module.exports = {
  getDateWithTimeZone
};