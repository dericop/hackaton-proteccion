/*
Bancolombia 2017
 */
'use strict';
const config = global.__configuration,
    commonMessages = global.__messages.common,
    CONSTANTS = require('./constants');

const userProfile = require('./userProfileDAO'),
    _ = require('lodash'),
    cert = require('../common/cert').cert;

// Configure template settings
_.templateSettings = {
    interpolate: /\{(\w+?)\}/g
};

function validateConsumer(consumerId) {
    let consumerApp = config.frontend.frontend.filter(c => c.consumerId === consumerId)[0];
    if (consumerApp) {
        return consumerApp.name;
    }
    return false;
}

function validateNotification(consumerId) {
    let notifyApp = config.notification;

    if (notifyApp.backendToken === consumerId) {
        return Promise.resolve();
    }
    return Promise.reject();
}

function verifySignatureHttp(req, res, buf) {

    let consumerId = req.get('x-consumer-id');
    let signature = req.headers['x-ctr-signature'];
    let clientApp = validateConsumer(consumerId);
    if (clientApp) {
        if (cert.validateSignature(req, signature, buf)) {
            req.headers.source = clientApp;
            return;
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(400);
    }
}

function verifySignatureNotify(req, res, buf) {

    let consumerId = req.get('x-consumer-id');
    let signature = req.headers['x-ctr-signature'];
    let clientApp = validateConsumer(consumerId);
    if (clientApp) {
        if (cert.validateSignature(req, signature, buf)) {
            req.headers.source = clientApp;
            return;
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(400);
    }
}

module.exports = {
    // Expose external utilities
    cache: (process.env.LOCAL) ? require('./cache.local') : require('./cache.prod'),
    constants: CONSTANTS,
    // mappings: require('./mappings'),
    messages: commonMessages,
    controls: require('./controls'),
    userProfile: userProfile,
    /**
     * Logging facilities... 
     */
    logging: require('./logging'),
    // Toy authorization provider
    auth: {
        validateConsumer: validateConsumer,
        validateNotification: validateNotification,
        verifySignatureHttp: verifySignatureHttp
    },
    contextKey: (prefix) => {
        return function (id) {
            return `${prefix}:${id}`;
        };
    },
    mergeMetadata: function (inputMessage, outputMessage) {
        let inMsg = inputMessage || {},
            outMsg = outputMessage || {};
        let inputMetadata = inMsg.metadata || {},
            outputMetadata = outMsg.metadata || {};
        Object.assign(outputMetadata, inputMetadata);
        outMsg.metadata = outputMetadata; // In case it was not defined already...
        return outMsg;
    },
    frontEndEndpoint: function (name) {
        let consumerApp = config.frontend.frontend.filter(c => c.name === name)[0];
        if (!consumerApp) {
            return null;
        }
        return consumerApp.endpoint;
    },
    idHeader: function (header) {
        let outHeader = {};
        if (header) {
            outHeader = header;
        }
        outHeader['x-consumer-id'] = config.parameters.BOTController.token;
        return outHeader;
    }
};
