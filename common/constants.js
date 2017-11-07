/*
Bancolombia 2017

Application wide constants

 */
'use strict';
const config = global.__configuration;

module.exports = {
    defaults: {
        BOT_NAME: 'Tabot',
        DIALOG_START: 'DIALOG_START',
        TEMP: 'TMP',
        ENTITY: 'ENTITY',
        UNSUPPORTED: 'UNSUPPORTED',
        THANKS_TOPIC: 'AGRADECER' // Revisar si se debe mover a base de datos
    },
    mediaType: {
        TEXT: 'texto',
        IMAGE: 'imagen',
        VIDEO: 'video',
        AUDIO: 'audio',
        LOCATION: 'ubicación'
    },
    action: {
        READY: 'READY',
        SHOW_HELP: 'SHOW_HELP',
        YES_NO: 'YES_NO',
        WAIT_FOR_RESPONSE: 'WAIT_FOR_RESPONSE',
        ASK_LOCATION: 'ASK_LOCATION',
        ASK_PREFERED_LAYOUT: 'ASK_PREFERED_LAYOUT',
        ACK: 'ACK',
        RETRY: 'RETRY',
        BUTTON: 'BUTTON',
        RETURN_TO: 'RETURN_TO',
        NEW_USER_VALIDATION: 'NEW_USER_VALIDATION',
        LOCK_TOPIC: 'LOCK_TOPIC'
    },
    reply: {
        UNKNOWN: 'UNKNOWN',
        CHANGE_TOPIC: 'CHANGE_TOPIC',
        YES: 'YES',
        NO: 'NO',
        LOCATION: 'LOCATION',
        LAYOUT: {
            TEXT: 'TEXT',
            LIST: 'LIST',
            MAP: 'MAP'
        },
        VIEW_MORE: 'VIEW_MORE',
        STAR5: '5',
        STAR4: '4',
        STAR3: '3',
        STAR2: '2',
        STAR1: '1'
    },
    context: {
        PREFIX_BOT: 'dialog'
    },
    watson: {
        TEXT_MAX_LENGTH: config.conversation.maxTextLength
    }

};