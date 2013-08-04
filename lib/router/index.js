/**
 * Module dependencies.
 */

var Route = require('./route')
  , utils = require('../utils')
  , debug = require('debug')('signal.io:router');

/**
 * Expose `Router` constructor.
 */

exports = module.exports = Router;

/**
 * Initialize a new `Router`.
 *
 * @api private
 */

function Router(options) {
  options = options || {};
  var self = this;
  this.routes = [];
  this.params = {};
  this._params = [];
  this.caseSensitive = options.caseSensitive;
  this.strict = options.strict;
  this.middleware = function router(socket, next) {
    self._dispatch(socket, next);
  };
}

/**
 * Register a param callback `fn` for the given `name`.
 *
 * @param {String|Function} name
 * @param {Function} fn
 * @return {Router} for chaining
 * @api public
 */

Router.prototype.param = function(name, fn) {
  // param logic
  if ('function' == typeof name) {
    this._params.push(name);
    return;
  }

  // apply param functions
  var params = this._params
    , len = params.length
    , ret;

  for (var i = 0; i < len; ++i) {
    if (ret = params[i](name, fn)) {
      fn = ret;
    }
  }

  // ensure we end up with a
  // middleware function
  if ('function' != typeof fn) {
    throw new Error('invalid param() call for ' + name + ', got ' + fn);
  }

  (this.params[name] = this.params[name] || []).push(fn);
  return this;
};

/**
 * Route dispatcher aka the route "middleware".
 *
 * @param {Socket} socket
 * @param {Function} next
 * @api private
 */

Router.prototype._dispatch = function(socket, next) {
  var params = this.params
    , self = this;

  debug('dispatching %s', socket.nsp.name);

  // route dispatch
  var paramCallbacks
    , paramIndex = 0
    , paramVal
    , route
    , keys
    , key
    , i;

  // match route
  socket.route = route = self.matchRequest(socket);

  // no route
  if (!route) {
    var err;
    if ('/' != socket.nsp.name) {
      err = new Error();
      err.data = new Error();
      err.data.status = 404;
    }
    return next(err);
  }
  debug('matched %s', route.path);

  // listen `connection` event.
  var nsp = socket.nsp;
  if (!~nsp.listeners('connection').indexOf(route.onconnection)) {
    nsp.on('connection', route.onconnection);
  }

  // we have a route
  // start at param 0
  socket.params = route.params;
  keys = route.keys;
  i = 0;

  // param callbacks
  function param(err) {
    paramIndex = 0;
    key = keys[i++];
    paramVal = key && socket.params[key.name];
    paramCallbacks = key && params[key.name];

    try {
      if ('route' == err) {
        next();
      } else if (err) {
        i = 0;
        callbacks(err);
      } else if (paramCallbacks && undefined !== paramVal) {
        paramCallback();
      } else if (key) {
        param();
      } else {
        i = 0;
        callbacks();
      }
    } catch (err) {
      param(err);
    }
  }

  param();

  // single param callbacks
  function paramCallback(err) {
    var fn = paramCallbacks[paramIndex++];
    if (err || !fn) return param(err);
    fn(socket, paramCallback, paramVal, key.name);
  }

  // invoke route callbacks
  function callbacks(err) {
    var fn = route.callbacks[i++];
    try {
      if ('route' == err) {
        next();
      } else if (err && fn) {
        if (fn.length < 3) return callbacks(err);
        fn(err, socket, callbacks);
      } else if (fn) {
        if (fn.length < 3) {
          fn(socket, callbacks);
          next();
          return;
        }
        callbacks();
      } else {
        next(err);
      }
    } catch (err) {
      callbacks(err);
    }
  }
};

/**
 * Attempt to match a route for `socket`.
 *
 * @param {Socket} socket
 * @return {Route}
 * @api private
 */

Router.prototype.matchRequest = function(socket) {
  var name = socket.nsp.name
    , routes = this.routes
    , route;

  // matching routes
  for (var i = 0, len = routes.length; i < len; i++) {
    route = routes[i];
    if (route.match(name)) {
      return route;
    }
  }
};

/**
 * Attempt to match a route for `name`.
 *
 * @param {String} url
 * @return {Route}
 * @api private
 */

Router.prototype.match = function(name) {
  var socket = { nsp: { name: name} };
  return this.matchRequest(socket);
};

/**
 * Route `path`, and one or more callbacks.
 *
 * @param {String} path
 * @param {Function} callback...
 * @return {Router} for chaining
 * @api private
 */

Router.prototype.route = function(path, callbacks) {
  var callbacks = utils.flatten([].slice.call(arguments, 1));

  // ensure path was given
  if (!path) throw new Error('Router#connect() requires a path');

  // ensure all callbacks are functions
  callbacks.forEach(function(fn, i) {
    if ('function' == typeof fn) return;
    var type = {}.toString.call(fn);
    var msg = '.connect() requires callback functions but got a ' + type;
    throw new Error(msg);
  });

  var onconnection = callbacks.pop();

  // create the route
  debug('defined %s', path);
  var route = new Route(path, callbacks, onconnection, {
    sensitive: this.caseSensitive,
    strict: this.strict
  });

  // add it
  this.routes.push(route);
  return this;
};

Router.prototype.connect = function(path) {
  this.route.apply(this, arguments);
  return this;
};
