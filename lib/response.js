
var util = require('util')
  , OutgoingMessage = require('http').OutgoingMessage;


module.exports = exports = Response;

/**
 * Flags.
 *
 * @api public
 */

exports.flags = [
  'broadcast'
];


function Response(socket) {
  OutgoingMessage.call(this);

  this.socket = socket;
  this.broadcast = false;
  this.method = null;
  this.ack = null;
}

util.inherits(Response, OutgoingMessage);

/**
 * Apply flags.
 */

exports.flags.forEach(function(flag) {
  Response.prototype.__defineGetter__(flag, function(){
    this.flags = this.flags || {};
    this.flags[flag] = true;
    return this;
  });
});

Response.prototype.send = function(err, body, headers) {
  this.ack && this.ack(err, body, headers);

  // skip broadcasting
  if (err || !this.flags || !this.flags.broadcast) return;

  var socket = this.socket;
  if (socket.rooms.length <= 1) {
    // broadcast to all sockets joined in the same namespace.
    socket.broadcast.emit(this.method, body, headers);
  } else {
    // broadcast to the same namespace and rooms.
    this.rooms.forEach(function(room) {
      if (room == socket.id) return;
      socket.broadcast.to(room).emit(this.method, body, headers);
    }, this);
  }
};
