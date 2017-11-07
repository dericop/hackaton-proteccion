/**
 * Bancolombia 2017
 * Improved main dialog script
 */
'use strict';
const builder = require('botbuilder');

const init = (obj) => {
  var normalizedPath = require("path").join(__dirname, "modules");
  require("fs").readdirSync(normalizedPath).forEach(function(file) {
    const resource = {
      builder,
      bot: obj.bot
    };
    require("./modules/" + file).init(resource);
  });
};

module.exports = {
  init,
};