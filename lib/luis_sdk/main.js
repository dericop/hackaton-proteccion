"use strict";

const LUISClient = require("./index"),
  config = require('../../DAO/modules/configuration').getConfiguration();

const APPID = config.conversation.credentials['app-id'];
const APPKEY = config.conversation.credentials['programmatic-key'];

var LUISclient = LUISClient({
  appId: APPID,
  appKey: APPKEY,
  verbose: true
});

var printOnSuccess = function (response) {
  console.log("Query: " + response.query);
  console.log("Top Intent: " + response.topScoringIntent.intent);
  console.log("Entities:");
  for (var i = 1; i <= response.entities.length; i++) {
    console.log(i + "- " + response.entities[i-1].entity);
  }
  if (typeof response.dialog !== "undefined" && response.dialog !== null) {
    console.log("Dialog Status: " + response.dialog.status);
    if(!response.dialog.isFinished()) {
      console.log("Dialog Parameter Name: " + response.dialog.parameterName);
      console.log("Dialog Prompt: " + response.dialog.prompt);
    }
  }
};

const message = (message, context) => {
  return new Promise((resolve, reject) => {
    LUISclient.predict(message.text, {
      //On success of prediction
      onSuccess: function (response) {
        printOnSuccess(response);
        resolve(response);
      },
    
      //On failure of prediction
      onFailure: function (err) {
        reject(err);
      }
    });
  });
};

module.exports = {
  message
};
