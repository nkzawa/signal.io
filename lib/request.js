
var util = require('util')
  , IncomingMessage = require('http').IncomingMessage;


module.exports = exports = Request;

function Request(socket) {
  IncomingMessage.call(this, socket);

  // expose properties
  this.request = socket.request;
  this.params = socket.params;
  this.route = socket.route;
  this.query = socket.request.query;
};

util.inherits(Request, IncomingMessage);

/**
 * Return request header.
 *
 * Aliased as `req.header()`.
 *
 * @param {String} name
 * @return {String}
 * @api public
 */

Request.prototype.get =
Request.prototype.header = function(name) {
  return this.headers[name.toLowerCase()];
};

/**
 * Return the value of param `name` when present or `defaultValue`.
 *
 *  - Checks route placeholders, ex: _/user/:id_
 *  - Checks body params, ex: id=12, {"id":12}
 *  - Checks query string params, ex: ?id=12
 *
 * To utilize request bodies, `req.body` should be an object.
 *
 * @param {String} name
 * @param {Mixed} [defaultValue]
 * @return {String}
 * @api public
 */

Request.prototype.param = function(name, defaultValue) {
  var params = this.params || {};
  var body = this.body || {};
  var query = this.query || {};
  if (null != params[name] && params.hasOwnProperty(name)) return params[name];
  if ('object' == typeof body && null != body[name]) return body[name];
  if (null != query[name]) return query[name];
  return defaultValue;
};

/**
 * Short-hand for `req.socket.nsp.name`.
 *
 * @return {String}
 * @api public
 */

Request.prototype.__defineGetter__('path', function() {
  return this.socket.nsp.name;
});
