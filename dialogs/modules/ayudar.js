'use strict';

const init = (obj) => {
  const bot = obj.bot;
  bot.dialog('Ayuda', function (session) {
    session.endDialog('Hi! Try asking me things like \'search hotels in Seattle\', \'search hotels near LAX airport\' or \'show me the reviews of The Bot Resort\'');
  }).triggerAction({
      matches: 'ayudar'
  });
};

module.exports = {
  init,
};