'use strict';
const moment = require('moment');

const getDateWithTimeZone = () => {
  return moment().utcOffset('-0500').format('YYYY-MM-DDTHH:mm:ss.SS ZZ').toString();
};

const getHour = () => {
  return moment().utcOffset('-0500').format('HH:mm:ss').toString();
};

module.exports = {
  getDateWithTimeZone,
  getHour
};