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
        common = require('./common');

    // Autoscaling agent...
    !process.env.LOCAL && require('bluemix-autoscaling-agent');

    // create a new express server and get the app environment from Cloud Foundry
    const app = express(),
        appEnv = cfenv.getAppEnv();

    app.use(helmet());
    // json body middleware
    // app.use(bodyParser.json());

    //const ctrlJsonParser = bodyParser.json({ verify: common.auth.verifySignatureHttp });
    //const ctrlJsonNotify = bodyParser.json({ verify: common.auth.verifySignatureNotify });

    // mount application routers
    app.use('/message', ctrlJsonParser, routes.routerBot);
    app.use('/status', routes.routerTest);

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