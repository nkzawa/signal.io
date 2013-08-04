
/**
 * Module dependencies.
 */

var utils = require('../utils');

/**
 * Expose `Route`.
 */

module.exports = Route;

/**
 * Initialize `Route` with the given HTTP `path`,
 * and an array of `callbacks`.
 *
 * @param {String} path
 * @param {Array} callbacks
 * @param {Function} onconnection
 * @api private
 */

function Route(path, callbacks, onconnection) {
  this.path = path;
  this.callbacks = callbacks;
  this.onconnection = onconnection;
  this.regexp = utils.pathRegexp(path , this.keys = []);
}

/**
 * Check if this route matches `path`, if so
 * populate `.params`.
 *
 * @param {String} path
 * @return {Boolean}
 * @api private
 */

Route.prototype.match = function(path) {
  var keys = this.keys
    , params = this.params = []
    , m = this.regexp.exec(path);

  if (!m) return false;

  for (var i = 1, len = m.length; i < len; ++i) {
    var key = keys[i - 1];

    var val = 'string' == typeof m[i]
      ? decodeURIComponent(m[i])
      : m[i];

    if (key) {
      params[key.name] = val;
    } else {
      params.push(val);
    }
  }

  return true;
};
