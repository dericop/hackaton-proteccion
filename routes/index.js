/*
Bancolombia 2017
 */

'use strict';

const express = require('express'),
  common = require('../common'),
  routerModules = require('./modules'),
  bot_controller = require('../controller');

// Logger
const logger = new common.logging({});

const routerBot = express.Router();

/**
 * @param message
 */
routerBot.post('/', function (req, res) {
    try {
      let message = req.body;
      bot_controller.messageReceived(message)
        .then(() => res.sendStatus(202))
        .catch(err => {
            res.sendStatus(500);
            logger.error({ err: err }, 'Error in controller - Message.');
        });
    } catch (err) {
        logger.error({ err: err }, 'Error routerBot.post');
    }
});

// Tests router
const routerStatus = express.Router();

routerStatus.get('/', function (req, res) {
  const data = {
    time: common.time.getDateWithTimeZone(),
  };
  res.status(200).json(data);
});

module.exports = {
  routerBot: routerBot,
  routerTest: routerStatus,
};
