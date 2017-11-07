/*
Bancolombia 2017
 */

'use strict';

const express = require('express'),
  logging = require('../common/logging'),
  config = global.__configuration,
  timestamp = require('../common/time'),
  bot_controller = require('../controller'),
  builder = require('botbuilder');

const routerBot = express.Router();

var connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector, function (session) {
  session.send('Lo siento, No le entiendo: \'%s\'. Escriba \'ayuda\' para conocer los servicios ofrecidos.', session.message.text);
});

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer(config.conversation.credentials.URL);
bot.recognizer(recognizer);
routerBot.post('/', connector.listen());

bot_controller.init({bot});

// Tests router
const routerStatus = express.Router();

routerStatus.get('/', function (req, res) {
  const data = {
    time: timestamp.getDateWithTimeZone(),
  };
  res.status(200).json(data);
});

module.exports = {
  routerBot: routerBot,
  routerStatus: routerStatus,
};
