var util = require('util')
  , _Server = require('socket.io')
  , Router = require('./router');


module.exports = Server;

util.inherits(Server, _Server);


function Server(srv, opts) {
  if (!(this instanceof Server)) {
    return new Server(srv, opts);
  }

  if ('object' == typeof srv && !srv.listen) {
    opts = srv;
    srv = null;
  }
  opts = opts || {};
  opts.path = opts.path || '/signal.io';

  _Server.call(this, srv, opts);

  this._router = new Router();
  this.routes = this._router.routes;
  this.__defineGetter__('router', function() {
    return this._router.middleware;
  });
}

/**
 * Map the given param placeholder `name`(s) to the given callback(s).
 *
 * @param {String|Array} name
 * @param {Function} fn
 * @return {Server} for chaining
 * @api public
 */

Server.prototype.param = function(name, fn) {
  var self = this
    , fns = [].slice.call(arguments, 1);

  // array
  if (Array.isArray(name)) {
    name.forEach(function(name) {
      fns.forEach(function(fn) {
        self.param(name, fn);
      });
    });
  // param logic
  } else if ('function' == typeof name) {
    this._router.param(name);
  // single
  } else {
    if (':' == name[0]) name = name.substr(1);
    fns.forEach(function(fn) {
      self._router.param(name, fn);
    });
  }

  return this;
};

/**
 * Delegate to `router.connect`.
 *
 * @api public
 */

Server.prototype.connect = function(route) {
  var args = [].slice.call(arguments);

  if ('function' == typeof route) {
    route = '/';
    args.unshift(route);
  }

  // setup route
  this._router.connect.apply(this._router, args);
  return this;
};

