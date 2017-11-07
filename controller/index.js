/*
Bancolombia 2017
 */

'use strict';
const config = require('../DAO/modules/configuration').getConfiguration(),
    commonMsg = global.__messages.common,
    helpMsg = global.__messages.help;

const APP_NAME = process.env.APP_NAME;
let bot = null;

const conversation = require('../lib/luis_sdk/main'),
    common = require('../common'),
    request = require('request-promise-native'),
    _ = require('lodash'),
    DialogManager = require('../dialogs/improved');

const contextKey = common.contextKey(common.constants.context.PREFIX_BOT);
// Utility function to allow context updates in arbitrary locations
// Needed because the cache does NOT store functions
function saveContext(ctxKey) {
    return function () {
        return common.cache.set(
            ctxKey,
            this,
            config.parameters.defaults.sessionTimeout);
    };
}

function _setDialogs() {
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
      
    bot.dialog('Ayuda', function (session) {
        session.endDialog('Hi! Try asking me things like \'search hotels in Seattle\', \'search hotels near LAX airport\' or \'show me the reviews of The Bot Resort\'');
    }).triggerAction({
        matches: 'ayudar'
    });
}

function messageReceived(message) {
    const senderId = message.senderId;
    // Logger
    const logger = new common.logging({
        messageId: message.messageId,
        senderId: senderId,
        source: message.source,
        destination: APP_NAME
    });

    try {
        const ctxKey = contextKey(senderId);

        // We use metadata for several things
        if (!message.metadata) {
            message.metadata = {};
        }

        // Retireve the dialog context
        return common.cache.getContext(ctxKey).then(context => {
            const dialogManager = new DialogManager(context, sendNotification);
            // Bind the save function to the current context object
            context.save = saveContext(ctxKey);
            // Bind the logger to the current context object (to make it available to other modules)
            context.logger = logger;
            context.source = message.source;
            // Create and store the profile for new users
            return common.userProfile.getUser(senderId).then(user => {
                context.user = user;
                let staticTopic = (message.metadata && message.metadata.topic) ? message.metadata.topic : '';

                // Primera interacción de un usuario con el BOT - Machete
                if (staticTopic == 'start') {
                    message.text = 'Hola';
                }

                if (message.text) {
                    message.text = message.text.replace(/[\n\r]/g, ' ');

                    if (message.text.length <= config.conversation.parameters.TEXT_MAX_LENGTH) {
                        conversation.message(message, context).then(output => {

                            let topic = staticTopic,
                                metadata = message.metadata || {};
                            metadata.topic = topic;
                            //Because the user accepted terms and conditions already 
                            if (metadata.topic === 'start') {
                                delete metadata.topic;
                                let startText = _.template(helpMsg.TITLES.START_MENU)({ userName: context.user.name, botName: config.parameters.defaults.botName });
                                return sendNotification(common.controls.plainTextResponse(message, startText))
                                    .then(() => {
                                        let responseMessage = help.mainHelpMenu(message, helpMsg.TITLES.HELP_MENU);
                                        sendNotification(responseMessage);
                                    });
                            }
                            message.inputText = message.text;
                            Object.assign(message, output);
                            return dialogManager.onMessage(message);
                        }).catch(err => logger.error({ err: err }, 'Error calling conversation service'));
                    } else {
                        logger.debug({ commonMessages: commonMsg }, 'Common messages');
                        return sendNotification(
                            common.controls.plainTextResponse(message, commonMsg.TEXT_MAX_LENGTH_MESSAGE)
                        ).then(() => {
                            let responseMessage = help.mainHelpMenu(message, helpMsg.TITLES.HELP_MENU);
                            sendNotification(responseMessage);
                        });
                    }
                } else {
                    if (message.metadata.type && (!message.metadata.topic || message.metadata.type !== 'location')) {
                        message.metadata.topic = common.constants.defaults.UNSUPPORTED;
                    } else if (message.metadata.topic === 'start') {
                        let startText = _.template(helpMsg.TITLES.START_MENU)({ userName: context.user.name, botName: config.parameters.defaults.botName });
                        return sendNotification(common.controls.plainTextResponse(message, startText))
                            .then(() => {
                                let responseMessage = help.mainHelpMenu(message, helpMsg.TITLES.GREETING);
                                sendNotification(responseMessage);
                            });
                    }
                    //call dialogAdapter Allways
                    return dialogManager.onMessage(message);
                }
            }).catch(err => {
                logger.error({ err: err }, 'Error getting user data from database');
                // TODO: Handle this exception - Move this!!
            });
        }).catch(err => {
            logger.error({ err: err }, 'Error reading cache');
            // TODO: Handle this exception - Move this!!
        });
    } catch (err) {
        logger.error({ err: err }, 'ERROR_FB_CTR » messageReceived');
    }
}

function sendNotification(message) {
    const logger = new common.logging({
        messageId: message.messageId,
        senderId: message.senderId,
        source: APP_NAME,
        destination: message.target
    });
    try {
        logger.info({ message: message }, 'Send message to front-end');
    } catch (err) {
        logger.error({ err: err }, 'ERROR_FB_CTR » sendNotification');
    }
}

const init = (obj) => {
    bot = obj.bot;
    _setDialogs();
};

module.exports = {
    messageReceived: messageReceived,
    init,
    //sendNotification: sendNotification,
};
