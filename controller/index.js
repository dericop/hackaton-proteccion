/*
Bancolombia 2017
 */

'use strict';
const config = require('../DAO/modules/configuration').getConfiguration();
const APP_NAME = process.env.APP_NAME;
let bot = null;

const common = require('../common'),
  DialogManager = require('../dialogs');

const init = (obj) => {
  bot = obj.bot;
  DialogManager.init({bot}); 
};

module.exports = {
  init,
};
