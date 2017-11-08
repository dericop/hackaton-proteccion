'use strict';
const _ = require('lodash'),
  config = global.__configuration,
  time = require('../../common/time'),
  greeMsg = global.__messages.greetings;
let builder = null;

const mostrarHora = (session, args, next) => {
  let name = null;
  session.send(`La hora es: ${time.getHour()}`);
  session.endDialog();
};

const init = (obj) => {
  const bot = obj.bot;
  builder = obj.builder;
  bot.dialog('saberHora', [
    mostrarHora,
  ]).triggerAction({
      matches: 'saber-hora',
      intentThreshold: 0.7      
  });
};

module.exports = {
  init,
};