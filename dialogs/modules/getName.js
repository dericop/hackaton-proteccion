'use strict';
const _ = require('lodash'),
  config = global.__configuration,
  greeMsg = global.__messages.greetings;
let builder = null;

const getName = (session, args, next) => {
  builder.Prompts.text(session, '¿como te llamas?');
};

const saveName = (session, results, next) => {
  let user = session.userData.user;
  if(user) {
    user.name = results.response;
  } else {
    session.userData.user = {
      name: results.response,
    };
  }
  session.endDialog();
};

const init = (obj) => {
  const bot = obj.bot;
  builder = obj.builder;
  bot.dialog('getName', [
    getName,
    saveName
  ]);
};

module.exports = {
  init,
};