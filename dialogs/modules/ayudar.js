'use strict';
const config = global.__configuration,
  common = require('../../common'),
  helpMsg = global.__messages.help;

let builder = null;

function createHeroCard(session) {
  return new builder.HeroCard(session)
    .title('Servicios Ofrecidos')
    .subtitle(helpMsg.TITLES.HELP_MENU)
    .images([
        builder.CardImage.create(session, common.appendToUrl(config.parameters.BOTController.endpoint, config.resources.pictures.mainMenu))
    ])
    .buttons([
        builder.CardAction.postBack(session, 'quiero saber la hora', 'Obtener la hora'),
        builder.CardAction .postBack(session, 'quiero saber la fecha', 'Obtener la fecha')
    ]);
}

const showMenu = (session) => {
  var card = createHeroCard(session);
  // attach the card to the reply message
  var msg = new builder.Message(session).addAttachment(card);
  session.send(msg);
  session.endDialog();
};

const init = (obj) => {
  const bot = obj.bot;
  builder = obj.builder;
  bot.dialog('Ayuda', [(session, results, next) => {
    showMenu(session);
  }, (session, results, next) => {
    session.endDialog();
  }]).triggerAction({
      matches: 'ayudar',
      confirmPrompt: "Esto cancelará su solicitud actual. ¿Estas segro?"
  });
  /*
  .endConversationAction({
        matches: 'despedida',
        confirmPrompt: "Esto cancelará su solicitud actual. ¿Estas segro?"
  }); */
};

module.exports = {
  init,
};