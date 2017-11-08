/*
Bancolombia 2017
 */

'use strict';

// Load configuration
require('./common/setup')().then(() => {

  const express = require('express'),
      bodyParser = require('body-parser'),
      cfenv = require('cfenv'),
      helmet = require('helmet'),
      routes = require('./routes'),
      logging = require('./common/logging');

  // Autoscaling agent...
  !process.env.LOCAL && require('bluemix-autoscaling-agent');
  const logger = new logging({});
  // create a new express server and get the app environment from Cloud Foundry
  const app = express(),
      appEnv = cfenv.getAppEnv();

  app.use(helmet());

  const log = function (req, res, next) {
    try {
      logger.info({ headers: req.headers, body: req.body }, 'Message received - BOT-CTR');
      req.body.source = req.headers.source;
    } catch (err) {
      logger.error({ req: req }, 'Error routerBot.use middleware');
    }
    next();
  };

  // json body middleware
  app.use(bodyParser.json());
  app.use(log); //Middleware Logging


  //const ctrlJsonParser = bodyParser.json({ verify: common.auth.verifySignatureHttp });
  //const ctrlJsonNotify = bodyParser.json({ verify: common.auth.verifySignatureNotify });

  // mount application routers
  // app.use('/message', ctrlJsonParser, routes.routerBot);
  app.use('/api/messages', routes.routerBot);
  app.use('/api/status', routes.routerStatus);
  app.use(express.static('public'));

  if (process.env.LOCAL) {
      appEnv.port = 6001;
  }
  // start server on the specified port and binding host
  app.listen(appEnv.port, appEnv.bind, function () {
    // print a message when the server starts listening
    if (process.env.LOCAL) {
        console.log(`Bot server starting on ${appEnv.bind}:${appEnv.port}`);
    }
    global.__root = process.cwd();
  });
}).catch(err => {
  let msg = 'Error loading configuration';
  if (process.env.LOCAL) {
    console.error(`${msg}: ${JSON.stringify(err)}`);
  } else {
    console.error(msg);
  }
});