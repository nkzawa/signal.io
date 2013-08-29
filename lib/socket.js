
var http = require('http')
  , Emitter = require('events').EventEmitter
  , Socket = require('socket.io/lib/socket')
  , Request = require('./request')
  , Response = require('./response')
  , utils = require('./utils')
  , debug = require('debug')('signal.io:socket');

// environment
var env = process.env.NODE_ENV || 'development';

var emit = Emitter.prototype.emit
  , on = Emitter.prototype.on;


module.exports = exports = Socket;

/**
 * Sets up socket middleware.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.use = function(fn) {
  this.fns = this.fns || [];
  this.fns.push(fn);
  return this;
};

/**
 * Handle requests, punting them down
 * the middleware stack.
 *
 * @api private
 */

Socket.prototype.handle = function(req, res, out) {
  if (!this._usedDispatcher) this.use(this.dispatcher);

  var fns = this.fns || []
    , index = 0;

  function next(err) {
    var fn, status;

    req.originalUrl = req.originalUrl || req.url;

    // next callback
    fn = fns[index++];

    // all done
    if (!fn || res.finished) {
      // delegate to parent
      if (out) return out(err);

      // unhandled error
      if (err) {
        // default to 500
        if (res.statusCode < 400) res.statusCode = 500;
        debug('default %s', res.statusCode);

        // respect err.status
        if (err.status) res.statusCode = err.status;

        // production gets a basic error message
        var msg = 'production' == env
          ? http.STATUS_CODES[res.statusCode]
          : err.stack || err.toString();

        // log to stderr in a non-test env
        if ('test' != env) console.error(err.stack || err.toString());
        if (res.finished) return;
        res.end(msg);
      } else {
        debug('default 405');
        res.statusCode = 405;
        res.end('Cannot ' + req.method + ' ' + req.originalUrl);
      }
      return;
    }

    try {
      debug('%s', fn.name || 'anonymous');
      var arity = fn.length;
      if (err) {
        if (arity === 4) {
          fn(err, req, res, next);
        } else {
          next(err);
        }
      } else if (arity < 4) {
        fn(req, res, next);
      } else {
        next();
      }
    } catch (e) {
      next(e);
    }
  }
  next();
};

/**
 * Event dispatcher middleware.
 *
 * @api public
 */

Socket.prototype.__defineGetter__('dispatcher', function() {
  this._usedDispatcher = true;

  var self = this;

  return function(req, res, next) {
    if ('/' == self.nsp.name && '/' != req.path) {
      req.socket.handle(req, res, next);
    } else {
      if (self.listeners(req.method).length) {
        emit.call(self, req.method, req, res, next);
      } else {
        next();
      }
    }
  };
});

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
    , type = args[0]
    , body = args[1]
    , headers = args[2] || {};

  req.method = res.method = type;
  req.body = body;
  if ('object' == typeof headers) {
    for (var k in headers) {
      req.headers[k.toLowerCase()] = headers[k];
    }
  }

  if (null != packet.id) {
    debug('attaching ack callback to event');
    res.ack = this.ack(packet.id);
  }

  this.client.nsps['/'].handle(req, res);
};

Socket.prototype.on = function(method, listener) {
  if (~exports.events.indexOf(method)) {
    return on.apply(this, arguments);
  }

  var self = this
    , callbacks = utils.flatten([].slice.call(arguments, 1))
    , broadcast = !!(this.flags && this.flags.broadcast);

  delete this.flags;

  // ensure method was given
  if (!method) throw new Error('Socket#on() requires a method');

  // ensure all callbacks are functions
  callbacks.forEach(function(fn, i) {
    if ('function' == typeof fn) return;
    var type = {}.toString.call(fn);
    var msg = '.on() requires callback functions but got a ' + type;
    throw new Error(msg);
  });

  return on.call(this, method, function(req, res, out) {
    // set the broadcast flag.
    broadcast && res.broadcast;

    var i = 0;

    function next(err) {
      var fn = callbacks[i++];

      // all done
      if (!fn) {
        // delegate to parent
        if (out) return out(err);
        return;
      }

      try {
        var arity = fn.length;
        if (err) {
          if (arity === 4) {
            fn(err, req, res, next);
          } else {
            next(err);
          }
        } else if (arity < 4) {
          fn(req, res, next);
        } else {
          next();
        }
      } catch (e) {
        next(e);
      }
    }

    next();
  });
};
