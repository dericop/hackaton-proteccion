/*
Bancolombia 2017
 */
'use strict';
const config = global.__configuration;

const common = require('../../../common'),
    helpMessages = global.__messages.help;

const uiControls = common.controls;

function mainHelpMenu(message, text) {
    return uiControls.circularMenu(
        message,
        [uiControls.helpers.circularMenuEntry(
            '❓',
            text,
            common.appendToUrl(config.parameters.BOTController.endpoint, config.resources.pictures.mainMenu), [
                uiControls.helpers.buttonEntry(helpMessages.TEXT_MENU_PTO_ATEN, helpMessages.VALUE_MENU_PTO_ATEN),
                uiControls.helpers.buttonEntry(helpMessages.TEXT_MENU_PTO_CONSU, helpMessages.VALUE_MENU_PTO_CONSU),
                uiControls.helpers.buttonEntry(helpMessages.TEXT_MENU_PTO_ASESO, helpMessages.VALUE_MENU_PTO_ASESO)
            ])
        ]
    );
}

function mainSubscriptionMenu(message, title, entries) {
    if (!entries) {
        const services = config.notification.services.filter(s => !!s.script);
        entries = services.map(s => {
            return {
                type: 'text',
                text: s.label,
                value: `${s.label}.${s.script}`
            }
        });
    }
    return uiControls.quickReplies(
        message,
        title,
        entries);
}

function redirectToCM(message, title) {
    let text;
    if (typeof title === 'string') {
        text = title;
    } else {
        text = title ? helpMessages.COMMUNITY_MANAGER_REDIRECT_ON_ERROR_MESSAGE : helpMessages.COMMUNITY_MANAGER_REDIRECT_MESSAGE;
    }
    return common.controls.linkResponse(message,
        text,
        helpMessages.COMMUNITY_MANAGER_REDIRECT_BUTTON,
        config.resources.links.communityManager);
}

module.exports = {
    mainHelpMenu: mainHelpMenu,
    messages: helpMessages,
    mainSubscriptionMenu: mainSubscriptionMenu,
    redirectToCM: redirectToCM
};