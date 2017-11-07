/**
 * Bancolombia 2017
 * Improved main dialog script
 */
'use strict';

const helpMessages = global.__messages.help,
    config = global.__configuration;

const common = require('../common'),
    _ = require('lodash');

const controls = common.controls,
    helpMenu = require('./extra/helpUtil').mainHelpMenu;

function customRequire(source, mod) {
    const toLoad = `./${source}/${mod.toLowerCase()}`;
    try {
        const dialog = require(toLoad);
        if (typeof (dialog) === 'function') {
            this.session.logger.debug({}, `Successfully loaded module ${toLoad}`);
            return dialog;
        } else {
            throw new Error(`Found module ${toLoad} is not a function!`);
        }
    } catch (ex) {
        this.session.logger.error({ err: ex }, `Failed to load module ${toLoad}`);
        return;
    }
}

/**
 * Discard all texts but the first one
 * @param {Message} message 
 */
function pruneTexts(message) {
    if (Array.isArray(message.text))
        message.text = message.text[0];
}

/**
 * Executes a sequence of tasks and a specified step function after each task.
 * All functions must return a Promise.
 * @param {Array || Function} tasks
 * @param {Function} step
 */
function stepedSequence(tasks, step, ctx) {
    if (Array.isArray(tasks)) {
        return tasks.reduce((promise, currentTask) =>
            promise
                .then(currentTask)
                .then(step)
                .then(result => {
                    // Verificar si se debe terminar el flujo
                    if (result.break)
                        return Promise.reject(result);
                    return result;
                }),
            Promise.resolve(ctx));
    }
    // If tasks is a single function:
    return tasks(ctx).then(step);
}

function stepReply(ctx) {
    if (ctx.reply) {
        const reply = applyTemplates(ctx);
        this.session.logger.debug(ctx.reply, 'Reply to consumer - after templates.');
        delete ctx.reply;
        return this.reply(reply).then(() => ctx);
    }
    return Promise.resolve(ctx);
}

function applyTemplates(ctx) {
    if (ctx.template) {
        const template = ctx.template,
            toApply = _.template(ctx.reply.getText());
        ctx.reply.setText(toApply(template.values));
        delete ctx.template;
    }
    return ctx.reply;
}

function updateUser(session) {
    let userAI = session.ai_context.user;

    /* Se debe validar desde el inicio si el objeto global del usuario ya tiene la propiedad 
    [termsAndConditions], si no lo tiene se le asigna para poder ser comparado correctamente en la iteración del for. */
    if (!session.user.termsAndConditions) {
        session.user.termsAndConditions = [];
    }

    for (let attribute in userAI) {
        let attr = attribute;

        if (session.user[attr] != userAI[attr]) {
            //tratamiento especial para términos y condiciones, cuando el conversation nos responde true, debemos registrar fecha y versión de la aceptación.
            if (attr == 'termsAndConditions') {
                //tenemos que validar que sí sean diferentes, evitar que se actualice el campo a true,se debe ingresarse el nuevo objeto
                if (common.utils.validateTerms(session.user) != userAI[attr]) {
                    let terms = {
                        version: config.termsAndConditions.version,
                        acceptanceDate: common.dateAsTimestampToString()
                    };
                    session.user.termsAndConditions.push(terms);
                    common.userProfile.putUser(session.user);
                    break;
                }
            }
            delete userAI.termsAndConditions;
            Object.assign(session.user, userAI);
            common.userProfile.putUser(session.user);
            break;
        }
    }
}

module.exports = class DialogScript {
    /**
     * 
     * @param {Context} session 
     * @param {Function} fnReply 
     */
    constructor(session, fnReply) {
        this.session = session;
        this.reply = fnReply;
        this.dialogCommons = common.dialog(session);
        // Default placeholders to replace in text messsages
        this.templateHelper = text => _.template(text)({
            userName: session.user.name,
            botName: config.parameters.defaults.botName
        });
    }

    saveSession() {
        const session = this.session;
        return session.save()
            .then(() => session.logger.debug('Session cache updated'))
            .catch(err => session.logger.error({ err: err }, 'Error updating session cache'));
    }

    /**
     * Text handler, sends text messages to the recipient
     * @param {Message} message 
     */
    textHandler(message) {
        if (Array.isArray(message.text)) {
            // Send all messages in sequence
            return message.text.map(text => {
                const textReply = controls.plainTextResponse(message, this.templateHelper(text));
                return ctx => {
                    ctx.reply = textReply;
                    return Promise.resolve(ctx);
                };
            });
        }
        // If there is no text to send, reply with the main menu
        const menu = helpMenu(message, helpMessages.TITLES.HELP_MENU);
        return ctx => {
            ctx.reply = menu;
            return Promise.resolve(ctx);
        };
    }

    extraDialog(topic) {
        return customRequire.call(this, 'extra', topic);
    };
    actionHandler(action) {
        return customRequire.call(this, 'actions', action.href);
    };
    controlHandler(control) {
        return customRequire.call(this, 'replies', control.type);
    };


    /**
     * Entry point for messages
     * @param {Message} message
     */
    onMessage(message) {
        const topic = message.metadata.topic;
        this.session.logger.debug(message, 'Run handlers on message');
        /*
         First try to load the module from ./extra
         */
        const dialog = this.extraDialog(topic);
        if (dialog) {
            this.session.logger.debug({}, 'Handle the message with an old module');
            this.dialogCommons.scriptTopic(topic);
            // Extra dialogs only support a single text
            pruneTexts(message);

            return dialog(message, this.session)
                .then(result => {
                    // Save the session
                    this.saveSession();
                    // Reply if the result is a message
                    if (typeof (result) === 'object') {
                        return this.reply(common.mergeMetadata(message, result));
                    }
                })
                .catch(err => this.session.logger.error({ err: err, topic: topic }, 'Error on dialog handler'));
        } else {
            this.dialogCommons.complete(true);
            updateUser(this.session);

            let tasks = [];
            if (message.action)
                tasks.push(this.actionHandler(message.action)(message));
            if (message.text)
                tasks = tasks.concat(this.textHandler(message));
            if (message.controls) {
                if (Array.isArray(message.controls)) {
                    const controls = message.controls;
                    delete message.controls;
                    controls.map(control => {
                        const tmp = { controls: control };
                        Object.assign(tmp, message);
                        return tasks.push(this.controlHandler(control)(tmp));
                    });
                } else {
                    tasks.push(this.controlHandler(message.controls)(message));
                }
            }
            return stepedSequence(tasks, stepReply.bind(this), this.session)
                .then(this.saveSession)
                .catch(err => {
                    this.saveSession();
                    if (err.break) {
                        this.session.logger.debug(err, 'Handlers flow manually ended.');
                        return err;
                    }
                    this.session.logger.error({ err: err }, 'Handlers flow unexpectedly ended.');
                });
        }
    }
};