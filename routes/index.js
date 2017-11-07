/*
Bancolombia 2017
 */

'use strict';

const express = require('express'),
  logging = require('../common/logging'),
  config = global.__configuration,
  timestamp = require('../common/time'),
  bot_controller = require('../controller');

const builder = require('botbuilder');
// Logger
const logger = new logging({});

const routerBot = express.Router();

var connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});
//routerBot.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, function (session) {
  session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer(config.conversation.credentials.URL);
bot.recognizer(recognizer);
routerBot.post('/', connector.listen());

bot.dialog('SearchHotels', [
  function (session, args, next) {
      session.send('Welcome to the Hotels finder! We are analyzing your message: \'%s\'', session.message.text);

      // try extracting entities
      var cityEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.geography.city');
      var airportEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'AirportCode');
      if (cityEntity) {
          // city entity detected, continue to next step
          session.dialogData.searchType = 'city';
          next({ response: cityEntity.entity });
      } else if (airportEntity) {
          // airport entity detected, continue to next step
          session.dialogData.searchType = 'airport';
          next({ response: airportEntity.entity });
      } else {
          // no entities detected, ask user for a destination
          builder.Prompts.text(session, 'Please enter your destination');
      }
  },
  function (session, results) {
      var destination = results.response;

      var message = 'Looking for hotels';
      if (session.dialogData.searchType === 'airport') {
          message += ' near %s airport...';
      } else {
          message += ' in %s...';
      }

      session.send(message, destination);

      // Async search
      Store
          .searchHotels(destination)
          .then(function (hotels) {
              // args
              session.send('I found %d hotels:', hotels.length);

              var message = new builder.Message()
                  .attachmentLayout(builder.AttachmentLayout.carousel)
                  .attachments(hotels.map(hotelAsAttachment));

              session.send(message);

              // End
              session.endDialog();
          });
  }
]).triggerAction({
  matches: 'SearchHotels',
  onInterrupted: function (session) {
      session.send('Please provide a destination');
  }
});

bot.dialog('Help', function (session) {
  session.endDialog('Hi! Try asking me things like \'search hotels in Seattle\', \'search hotels near LAX airport\' or \'show me the reviews of The Bot Resort\'');
}).triggerAction({
  matches: 'Help'
});

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
