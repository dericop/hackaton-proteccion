'use strict';

const init = (obj) => {
  const bot = obj.bot;
  const builder = obj.builder;
  bot.dialog('Saludo', function (session) {
    session.send('Hola, te puedo ayudar con');
    builder.Prompts.text(session, 'Please enter your destination');
  }).triggerAction({
      matches: 'saludar'
  });
};

module.exports = {
  init,
};