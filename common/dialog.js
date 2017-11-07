/*
 Bancolombia 2017
 General functions to handle dialog state
 */
'use strict';

const constants = require('./constants');

function init(context) {
    // Make sure the 'current_script' object exists:
    if (!context.current_script) {
        context.current_script = {}
    }
    let current = context.current_script;
    if (!current.waiting_for_reply) {
        current.waiting_for_reply = false; // Do not wait for reply by default
    }

    function clear() {
        delete context.current_script;
        context.current_script = {};
        current = context.current_script;
    }

    function scriptTopic(topic) {
        if (typeof (topic) === 'string') {
            current.topic = topic;
        }
        return current.topic;
    }

    function complete(complete, message) {
        if (typeof (complete) === 'boolean') {
            current.complete = complete;

            if (message && message.metadata) {
                delete message.metadata.topic;
                // Log the topic completion
                context.logger.info({ topic: current.topic }, 'Dialog completed');
            }
        }
        return current.complete;
    }

    function sessionData(key, value) {
        let session = context.session;
        if (!session) {
            context.session = {};
            session = context.session;
        }

        if (typeof (value) !== 'undefined') {
            session[key] = value;
        }
        context.logger.debug({ topic: current.topic, step: current.step, key: key, value: value }, 'Session-wide data store');
        return session[key];
    }

    function deleteSessionData(key) {
        let session = context.session;
        if (!session) {
            return false;
        }
        if (typeof (session[key]) !== 'undefined') {
            context.logger.debug({ topic: current.topic, step: current.step, key: key }, 'Remove session-wide data store entry');
            return delete session[key];
        }
    }

    function postponeDialog(message, newScript) {
        sessionData(constants.action.RETURN_TO, scriptTopic());
        message.metadata.topic = newScript;
        scriptTopic(newScript);
        const target = require(`${global.__root}/dialogs/extra/${scriptTopic()}`);
        const args = [message, context].concat([].slice.call(arguments, 2)); // Call the function with all the arguments received
        return target.apply(null, args);
    }

    function toPreviousDialog(message) {
        complete(true, message);
        clear();
        scriptTopic(sessionData(constants.action.RETURN_TO));
        deleteSessionData(constants.action.RETURN_TO);
        const previous = require(`${global.__root}/dialogs/extra/${scriptTopic()}`);
        const args = [message, context, true].concat([].slice.call(arguments, 3)); // Call the function with all the arguments received
        return previous.apply(null, args);
    }

    return {
        currentScript: current, // Just a handy reference...
        clear: clear,
        scriptTopic: scriptTopic,
        previousStep: function () {
            if (typeof (current.step) !== 'number') {
                current.step = 0;
            } else {
                if (current.step >= 1)
                    current.step--;
            }
            // Log the dialog step
            context.logger.info({ topic: current.topic, step: current.step }, 'Dialog step backward');
            return current.step;
        },
        nextStep: function (step) {
            // Log the dialog step
            context.logger.info({ topic: current.topic, step: current.step }, 'Dialog step done');
            if (typeof (step) === 'number') {
                current.step = step;
            } else {
                if (!current.step) {
                    current.step = 1;
                } else {
                    current.step++;
                }
            }
            return current.step;
        },
        currentStep: () => current.step || 0,
        started: function () {
            return current.step > 0;
        },
        complete: complete,
        currentEntity: function (entity) {
            if (entity) {
                current.entity = entity;
            }
            return current.entity;
        },
        dataDictionary: function (key, value) {
            if (typeof (value) !== 'undefined') {
                current[key] = value;
            }
            context.logger.debug({ topic: current.topic, step: current.step, key: key, value: value }, 'Dialog data store');
            return current[key];
        },
        deleteDataDictionary: function (key) {
            if (typeof (current[key]) !== 'undefined') {
                context.logger.debug({ topic: current.topic, step: current.step, key: key }, 'Remove dialog data store entry');
                return delete current[key];
            }
            return false;
        },
        waitingForReply: function (expectedReply) {
            if (typeof (expectedReply) !== 'undefined') {
                current.waiting_for_reply = expectedReply;
            }
            return current.waiting_for_reply;
        },
        sessionData: sessionData,
        deleteSessionData: deleteSessionData,
        postponeDialog: postponeDialog,
        toPreviousDialog: toPreviousDialog
    }
}

module.exports = init;

