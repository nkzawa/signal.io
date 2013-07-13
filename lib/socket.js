
var Emitter = require('events').EventEmitter
  , Socket = require('socket.io/lib/socket')
  , Request = require('./request')
  , Response = require('./response')
  , debug = require('debug')('signal.io:socket');


module.exports = exports = Socket;

var emit = Emitter.prototype.emit
  , on = Emitter.prototype.on;

Socket.prototype.use = function(fn) {
  this.fns = this.fns || [];
  this.fns.push(fn);
  return this;
};

/**
 * Called upon event packet.
 *
 * @param {Object} packet object
 * @api private
 */
Socket.prototype.onevent = function(packet) {
  var args = packet.data || [];
  debug('emitting event %j', args);

  var req = new Request(this)
    , res = new Response(this)
    , type = args.shift();

  req.method = res.method = type;
  req.body = args.shift();
  req.headers = args.shift() || {};

  if (null != packet.id) {
    debug('attaching ack callback to event');
    res.ack = this.ack(packet.id);
  }

  var self = this
    , i = 0;

  this.fns = this.fns || [];

  function next(err) {
    var fn = self.fns[i++];
    if (!fn) {
      emit.call(self, type, self, req, res);
      return;
    }

    if (err) {
      if (fn.length === 5) {
        fn(err, self, req, res, next);
      } else {
        next(err);
      }
    } else {
      if (fn.length === 5) {
        next();
      } else {
        fn(self, req, res, next);
      }
    }
  }

  next();
};

Socket.prototype.on = function(type, listener) {
  if (~exports.events.indexOf(type)) {
    on.apply(this, arguments);
    return;
  }

  if (this.flags && this.flags.broadcast) {
    delete this.flags;

    on.call(this, type, function(socket, req, res) {
      res.broadcast = true;
      listener(socket, req, res);
    });
  } else {
    on.apply(this, arguments);
  }
};
