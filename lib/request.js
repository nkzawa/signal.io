
var util = require('util')
  , IncomingMessage = require('http').IncomingMessage;


module.exports = exports = Request;

function Request(socket) {
  IncomingMessage.call(this, socket);

  // expose `request`
  this.request = socket.request;
};

util.inherits(Request, IncomingMessage);
