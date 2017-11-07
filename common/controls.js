/*
Bancolombia 2017

Functions to format response messages with different controls specified

 */
'use strict';

const constants = require('./constants');

const TYPE_QUICK_REPLY = 'QUICK_REPLY',
    TYPE_TEXT_AND_LINKS = 'TEXT_AND_LINKS',
    TYPE_TEXT_AND_BUTTONS = 'TEXT_AND_BUTTONS',
    TYPE_LIST_MENU = 'LIST_MENU',
    TYPE_RICH_LIST_MENU = 'RICH_LIST_MENU',
    TYPE_CIRCULAR_MENU = 'CIRCULAR_MENU',
    TYPE_IMAGE = 'IMAGE',
    TYPE_LINK = 'LINK',
    TYPE_BUTTON = 'BUTTON',
    TYPE_LOCATION = 'LOCATION';

function baseResponse(requestMessage, action) {
    const msg = {
        recipientId: requestMessage.senderId,
        messageId: requestMessage.messageId, // Global conversation identifier
        target: requestMessage.source,
        metadata: requestMessage.metadata
    }
    if (action) {
        msg.action = action;
    }
    return msg;
}

function plainTextResponse(requestMessage, text, action) {
    let base = baseResponse(requestMessage, action);
    base.text = (typeof (text) === 'string') ? text : text.text;

    base.getText = () => base.text;
    base.setText = text => base.text = text;
    return base;
}

function quickReplies(requestMessage, title, entries) {
    let base = baseResponse(requestMessage);
    base.control = {
        type: TYPE_QUICK_REPLY,
        title: title,
        payload: entries
    };
    base.getText = () => base.control.title;
    base.setText = text => base.control.title = text;
    return base;
}

function textAndLinks(requestMessage, title, entries) {
    let base = baseResponse(requestMessage);
    base.control = {
        type: TYPE_TEXT_AND_LINKS,
        title: title,
        payload: entries
    };
    base.getText = () => base.control.title;
    base.setText = text => base.control.title = text;
    return base;
}

function textAndButtons(requestMessage, title, entries) {
    let base = baseResponse(requestMessage);
    base.control = {
        type: TYPE_TEXT_AND_BUTTONS,
        title: title,
        payload: entries
    };
    base.getText = () => base.control.title;
    base.setText = text => base.control.title = text;
    return base;
}

function listMenu(requestMessage, title, entries) {
    let base = baseResponse(requestMessage);
    base.control = {
        type: TYPE_LIST_MENU,
        title: title,
        payload: entries
    };
    base.getText = () => base.control.title;
    base.setText = text => base.control.title = text;
    return base;
}

function circularMenu(requestMessage, entries) {
    let base = baseResponse(requestMessage);
    base.control = {
        type: TYPE_CIRCULAR_MENU,
        payload: entries
    };
    return base;
}

function richListMenu(requestMessage, entries, header, footer) {
    let base = baseResponse(requestMessage);
    base.control = {
        type: TYPE_RICH_LIST_MENU,
        payload: {
            entries: entries
        }
    };
    if (header) {
        base.control.payload.header = header;
    }
    if (footer) {
        base.control.payload.footer = footer;
    }

    return base;
}

function imageResponse(requestMessage, imageUrl) {
    let base = baseResponse(requestMessage);
    base.control = {
        type: TYPE_IMAGE,
        payload: imageUrl
    };
    return base;
}

function linkResponse(requestMessage, title, text, link, extra) {
    let base = baseResponse(requestMessage);
    base.control = {
        type: TYPE_LINK,
        title: title,
        text: text,
        payload: link
    };
    base.getText = () => base.control.text;
    base.setText = text => base.control.text = text;
    if (extra) {
        base.control.extra = extra;
    }
    return base;
}

function notificationMessage(target, recipientId, message) {
    return {
        target: target,
        recipientId: recipientId,
        text: message.text,
        metadata: message.metadata
    }
}

/*
 Helper functions
 */
function baseEntry(text, value) {
    return {
        text: text,
        value: value
    }
}

function buttonEntry(text, value) {
    let entry = baseEntry(text, value);
    entry.type = TYPE_BUTTON;
    return entry;
}

function linkEntry(text, value) {
    let entry = baseEntry(text, value);
    entry.type = TYPE_LINK;
    return entry;
}

function quickReplyEntry(text, value, image) {
    let entry = baseEntry(text, value);
    if (image) {
        entry.image = image;
    }
    return entry;
}

function locationEntry() {
    return {
        type: TYPE_LOCATION
    }
}

function circularMenuEntry(title, text, image, buttons) {
    let entry = {
        title: title,
        subtitle: text,
        image: image,
        buttons: buttons
    }
    return entry;
}

function richMenuEntry(title, text, image, button) {
    let entry = {
        title: title
    }
    if (text) {
        entry.text = text;
    }
    if (image) {
        entry.image = image;
    }
    if (button) {
        entry.button = button;
    }
    return entry;
}

function yesNoQuickReply(message, title) {
    var entries = [
        quickReplyEntry('Sí', constants.reply.YES),
        quickReplyEntry('No', constants.reply.NO)
    ]
    return quickReplies(message, title, entries);
}

function AcceptQuickReply(message, title) {
    var entries = [
        quickReplyEntry('Acepto', constants.reply.YES),
        quickReplyEntry('No acepto', constants.reply.NO)
    ]
    return quickReplies(message, title, entries);
}

function genericQuickReply(message, payload) {
    var entries = [];
    payload.values.forEach(function (text) {
        entries.push(quickReplyEntry(text.text, text.value.concat('_cgn')));
    });
    return quickReplies(message, payload.values.title, entries);
}

function RateAppReplies(message, title) {
    var entries = [
        quickReplyEntry('1⭐', constants.reply.STAR1),
        quickReplyEntry('2⭐', constants.reply.STAR2),
        quickReplyEntry('3⭐', constants.reply.STAR3),
        quickReplyEntry('4⭐', constants.reply.STAR4),
        quickReplyEntry('5⭐', constants.reply.STAR5)
    ]
    return quickReplies(message, title, entries);
}

class APIMessage {
    constructor(subject, senderId) {
        this.meta = {
            subject: subject,
            senderId: senderId
        }
    }
}

class APIDataMessage extends APIMessage {
    constructor(subject, senderId, data) {
        super(subject, senderId);
        this.data = [];
        if (Array.isArray(data)) {
            this.data = this.data.concat(data);
        } else if (data) {
            this.data.push(data);
        }
    }

    data(data) {
        if (Array.isArray(data)) {
            this.data.concat(data);
        }
    }

    addData(obj) {
        if (!this.data) {
            this.data = []
        }
        this.data.push(obj);
    }
}

class APIErrorMessage extends APIMessage {
    constructor(subject, senderId, error) {
        super(subject, senderId);
        this.errors = [];
        if (Array.isArray(error)) {
            //this.errors.concat(error);
            this.errors = this.errors.concat(error);
        } else {
            this.errors.push(error);
        }
    }
}

/*
Module definition
 */
module.exports = {
    baseResponse: baseResponse,
    plainTextResponse: plainTextResponse,
    quickReplies: quickReplies,
    textAndLinks: textAndLinks,
    textAndButtons: textAndButtons,
    listMenu: listMenu,
    richListMenu: richListMenu,
    circularMenu: circularMenu,
    imageResponse: imageResponse,
    linkResponse: linkResponse,
    notificationMessage: notificationMessage,
    helpers: {
        yesNoQuickReply: yesNoQuickReply,
        buttonEntry: buttonEntry,
        linkEntry: linkEntry,
        quickReplyEntry: quickReplyEntry,
        locationEntry: locationEntry,
        circularMenuEntry: circularMenuEntry,
        AcceptQuickReply: AcceptQuickReply,
        RateAppReplies: RateAppReplies,
        richMenuEntry: richMenuEntry,
        genericQuickReply: genericQuickReply
    },
    API: {
        DataMessage: APIDataMessage,
        ErrorMessage: APIErrorMessage
    }
}