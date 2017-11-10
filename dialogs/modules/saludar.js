'use strict';
const _ = require('lodash'),
  config = global.__configuration,
  greeMsg = global.__messages.greetings;
let builder = null;

const getFirstName = (name) => {
  return name.split(' ')[0];
};

const verifyName = (session, args, next) => {
  //session.send('Hola =)');
  if(!session.userData.user) {
    session.userData.user = {};
  }
  session.send(JSON.stringify(session.message.user));
  if(!session.userData.user.name) {
    if(session.message.user.name) {
      session.userData.user.name = getFirstName(session.message.user.name);
      next();
    } else {
      session.beginDialog('getName');
    }
  } else {
    next();
  }
};

const toGreet = (session, args, next) => {
  let name = null;
  if(session.userData.user) {
    name = session.userData.user.name;
  }
  let message = (name) ? greeMsg.messages.GREETINGS_NAME : greeMsg.messages.GREETINGS_NO_NAME;
  let startText = _.template(message)({ userName: name, botName: config.parameters.defaults.botName });
  //builder.Prompts.text(session, startText);
  session.send(startText);
  session.endDialog();
};

const init = (obj) => {
  const bot = obj.bot;
  builder = obj.builder;
  bot.dialog('Saludo', [
    verifyName,
    toGreet
  ]).triggerAction({
      matches: 'saludar',
      intentThreshold: 0.84      
  });
};

module.exports = {
  init,
};