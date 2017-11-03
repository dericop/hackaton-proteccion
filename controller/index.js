/*
Bancolombia 2017
 */

'use strict';
const config = require('../DAO/modules/configuration').getConfiguration(),
    commonMsg = global.__messages.common,
    helpMsg = global.__messages.help;

const APP_NAME = process.env.APP_NAME;

const conversation = require('../lib/luis_sdk'),
    common = require('../common'),
    request = require('request-promise-native'),
    help = require('../dialogs/extra/helpUtil'),
    _ = require('lodash'),
    cert = require('../common/cert').cert,
    // dialogManager = require('../dialogs/cognitiva/dialogAdapter');
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

function messageReceived(message) {

  return {hola:"hola"};
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
                //user exist
                if (!user.name) {
                    logger.info({ text: 'New user. Try to get the name from Facebook' });
                    // Try to get the user's name
                    fbApi.getUserName(senderId).then(names => {
                        user.name = names.first_name;
                        user.lastname = names.last_name;
                        common.userProfile.putUser(user);
                    });
                }
                context.user = user;
                let staticTopic = (message.metadata && message.metadata.topic) ? message.metadata.topic : '';

                // Primera interacción de un usuario con el BOT - Machete
                if (staticTopic == 'start') {
                    message.text = 'Hola';
                }

                if (message.text) {
                    message.text = message.text.replace(/[\n\r]/g, ' ');

                    if (message.text.length <= common.constants.watson.TEXT_MAX_LENGTH) {
                        conversation.message(message, context).then(output => {

                            if (output.intent === common.constants.reply.UNKNOWN) {
                                // Watson did not understand...
                                context.save();
                                return sendNotification(help.redirectToCM(message));
                            }
                            let topic = config.conversation.mappings.topics[output.intent] || staticTopic,
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

        let url = common.frontEndEndpoint(message.target);

        // A flag to specify the message origin
        if (message.metadata) {
            message.metadata.producer = config.parameters.defaults.botName;
        }

        let signature = cert.getSignature(message);

        if (signature) {
            if (url) {
                return request({
                    uri: url,
                    headers: {
                        'x-consumer-id': config.parameters.BOTController.token,
                        'x-ctr-signature': signature
                    },
                    json: true,
                    method: 'POST',
                    body: message
                }).catch(err => {
                    logger.error({ err: err }, 'Error sending message to front-end controller')
                    return Promise.reject();
                });
            } else {
                return Promise.reject('Missing URL');
            }
        } else {
            return Promise.reject('Missing signature');
        }
    } catch (err) {
        logger.error({ err: err }, 'ERROR_FB_CTR » sendNotification');
    }
}

function notificationReceived(psuid, message) {
    const logger = new common.logging({
        messageId: message.metadata.messageId,
        senderId: psuid,
        source: message.metadata.producer,
        destination: APP_NAME
    });

    logger.debug({ message: message }, 'Notification message');
    let msg = common.controls.notificationMessage('FACEBOOK', psuid, message);
    return sendNotification(msg)
        .then(() => logger.info('Message sent to facebook controller'))
        .catch(err => logger.error({ err: err }, 'Error sending message to front-end controller'));
}

function sessionInfo(sessionId) {
    if (!sessionId) {
        return Promise.reject();
    }
    return common.cache.getContext(sessionId).then(result => {
        common.cache.set(sessionId, undefined, config.parameters.defaults.securityTimeout);
        return result.data ? result : Promise.reject();
    });
}

function _getMessageErrorNoSession(senderId) {
    return Promise.reject(new common.controls.API.ErrorMessage('AUTHENTICATION', senderId, {
        code: 401,
        description: 'Error: ' + commonMsg.WEBVIEW_SESSION_EXPIRED
    }));
}

function webBackend(message) {
    const handlers = (context, senderId) => {
        context.senderId = senderId;
        const logger = new common.logging({
            messageId: message.meta.sessionId,
            senderId: senderId,
            source: 'WEB',
            destination: APP_NAME
        });
        context.logger = logger;
        context.save = saveContext(contextKey(senderId));
        return require('../handlers')(context, message)
            .then((res) => {
                context.save();
                return res;
            });
    };
    const sessionId = (message.meta && message.meta.sessionId) ? message.meta.sessionId : null,
        senderId = (message.meta && message.meta.senderId) ? message.meta.senderId : null;

    if (sessionId && !senderId) {
        // Get psuid, then get the context
        return common.cache.getContext(sessionId)
            .then(sessionRef => {
                if (sessionRef.senderId) {
                    const uid = sessionRef.senderId;
                    //DELETE UUID
                    common.cache.set(sessionId, undefined, config.parameters.defaults.securityTimeout);
                    return common.cache.getContext(contextKey(uid))
                        .then(context => {
                            if (context.user) {
                                return handlers(context, uid);
                            } else {
                                return _getMessageErrorNoSession(sessionRef.senderId);
                            }
                        });
                } else {
                    return _getMessageErrorNoSession(sessionId);
                }

            });
    } else {
        if (senderId) {
            return common.cache.getContext(contextKey(senderId))
                .then(context => handlers(context, senderId));
        } else {
            return _getMessageErrorNoSession('NO DATA');
        }
    }
}

module.exports = {
    messageReceived: messageReceived,
    sendNotification: sendNotification,
    notificationReceived: notificationReceived,
    sessionInfo: sessionInfo,
    webBackend: webBackend
};
