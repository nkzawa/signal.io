
var util = require('util')
  , IncomingMessage = require('http').IncomingMessage;


module.exports = exports = Request;

function Request(socket) {
  IncomingMessage.call(this, socket);
};

util.inherits(Request, IncomingMessage);
