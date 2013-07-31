
var session = require('socket.io-bundle').session
  , Socket = require('../socket')
  , Response = require('../response')
  , debug = require('debug')('signal.io:middleware/session');


module.exports = session;

// proxy `onevent` to reload the session object.
var onevent = Socket.prototype.onevent;

Socket.prototype.onevent = function(packet) {
  var session = this.request.session;
  if (!session) {
    return onevent.apply(this, arguments);
  }

  var self = this;
  session.reload(function(err) {
    if (err) console.error(err.stack);
    onevent.call(self, packet);
  });
};

// proxy `send` to commit the session.
var send = Response.prototype.send;

Response.prototype.send = function() {
  var session = this.socket.request.session;
  if (!session) return send.apply(this, arguments);

  var self = this
    , args = arguments;

  debug('saving');
  session.resetMaxAge();
  session.save(function(_err) {
    if (_err) console.error(_err.stack);
    debug('saved');
    send.apply(self, args);
  });
};
