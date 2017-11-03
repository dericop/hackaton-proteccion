/*
Bancolombia 2017
 */
'use strict';
const config = global.__configuration,
    commonMessages = global.__messages.common;

const userProfile = require('./userProfileDAO'),
    _ = require('lodash'),
    timestamp = require('time-stamp'),
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

const CONSTANTS = require('./constants');

module.exports = {
    // Expose external utilities
    cache: (process.env.LOCAL) ? require('./cache.local') : require('./cache.prod'),
    constants: CONSTANTS,
    // mappings: require('./mappings'),
    messages: commonMessages,
    dialog: require('./dialog'),
    security: require('./security'),
    controls: require('./controls'),
    userProfile: userProfile,
    utils: require('./utils'),
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
            return `${prefix}:${id}`
        }
    },
    appendToUrl: function (url, resource) {
        let l = url.length;
        if (resource[0] === '/')
            resource = resource.substring(1);
        return (url[l - 1] === '/') ?
            url + resource :
            url + '/' + resource;
    },
    includes: function includes(array, value) {
        if (Array.isArray(value)) {
            return array.filter(c => value.indexOf(c) > -1).length > 0
        } else {
            return array.indexOf(value) > -1;
        }
    },
    promiseSequence: function (array, fn) {
        if (Array.isArray(array)) {
            return array.reduce((promise, c) => {
                return promise
                    .then(() => fn(c))
                    .catch(() => false);
            }, Promise.resolve());
        } else {
            return fn(array);
        }
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
    yesNoReply: function (message) {
        if (message.reply) {
            return message.reply;
        }
        var testYes = /^s(i|í)$/gi,
            testNo = /^no$/gi;
        if (testYes.test(message.text)) {
            return CONSTANTS.reply.YES;
        }
        if (testNo.test(message.text)) {
            return CONSTANTS.reply.NO;
        }
        return CONSTANTS.reply.UNKNOWN;
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
    },
    dateAsTimestampToString: dateAsTimestampToString,
    dateToString: dateToString,
    dateTimeToString: dateTimeToString,
    AppRateReply: function (message) {
        if (message.reply) {
            return message.reply;
        }
        var test5 = /^[5]+$/gi,
            testCinco = /^c(i|í)nco$/gi,
            test4 = /^[4]+$/gi,
            testCuatro = /^cuatro$/gi,
            test3 = /^[3]+$/gi,
            testTres = /^tres$/gi,
            test2 = /^[2]+$/gi,
            testDos = /^dos$/gi,
            test1 = /^[1]+$/gi,
            testUno = /^uno$/gi;
        if (test5.test(message.text) || testCinco.test(message.text)) {
            return CONSTANTS.reply.STAR5;
        }
        if (test4.test(message.text) || testCuatro.test(message.text)) {
            return CONSTANTS.reply.STAR4;
        }
        if (test3.test(message.text) || testTres.test(message.text)) {
            return CONSTANTS.reply.STAR3;
        }
        if (test2.test(message.text) || testDos.test(message.text)) {
            return CONSTANTS.reply.STAR2;
        }
        if (test1.test(message.text) || testUno.test(message.text)) {
            return CONSTANTS.reply.STAR1;
        }
        return CONSTANTS.reply.UNKNOWN;
    },
    AcceptQuickReply: function (message) {
        if (message.reply) {
            return message.reply;
        }
        let testAcepto = /^acepto$/gi,
            testSi = /^si$/gi,
            testOk = /^ok$/gi;
        let testNoAcepto = /^No acepto$/gi,
            testNo = /^no$/gi;
        if (testAcepto.test(message.text) || testSi.test(message.text) || testOk.test(message.text)) {
            return CONSTANTS.reply.YES;
        }
        if (testNoAcepto.test(message.text) || testNo.test(message.text)) {
            return CONSTANTS.reply.NO;
        }
        return CONSTANTS.reply.UNKNOWN;
    }
}
