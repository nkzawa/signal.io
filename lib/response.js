
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
  this.method = null;
  this.ack = null;
}

util.inherits(Response, OutgoingMessage);

Response.prototype.statusCode = 200;

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

/**
 * Targets a room when broadcasting. Delegate to socket.
 *
 * @param {String} name
 * @return {Response} self
 * @api public
 */

Response.prototype.to =
Response.prototype.in = function(name) {
  this.socket.to(name);
  return this;
};

/**
 * Set status `code`.
 *
 * @param {Number} code
 * @return {Response}
 * @api public
 */

Response.prototype.status = function(code) {
  this.statusCode = code;
  return this;
};

/**
 * Send a response.
 *
 * @param {Mixed} body or status
 * @param {Mixed} body
 * @return {Response}
 * @api public
 */

Response.prototype.send = function(body) {
  if (this.finished) return this;

  if (2 == arguments.length || 'number' == typeof body) {
    this.statusCode = body;
    body = arguments[1];
  }

  this.end(body);
  return this;
};

/**
 * Set header `field` to `val`, or pass
 * an object of header fields.
 *
 * Aliased as `res.header()`.
 *
 * @param {String|Object|Array} field
 * @param {String} val
 * @return {Response} for chaining
 * @api public
 */

Response.prototype.set =
Response.prototype.header = function(field, val) {
  if (2 == arguments.length) {
    val = Array.isArray(val) ? val.map(String) : String(val);
    this.setHeader(field, val);
  } else {
    for (var key in field) {
      this.set(key, field[key]);
    }
  }
  return this;
};

/**
 * Get value for header `field`.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field) {
  return this.getHeader(field);
};

Response.prototype.end = function(data, encoding) {
  if (this.finished) return false;

  var err;
  if (this.statusCode && this.statusCode >= 400) {
    err = new Error();
    err.status = this.statusCode;
  }

  this.ack && this.ack(err, data, this._headers || {});

  if (!err && this.flags && this.flags.broadcast) {
    // broadcast to all sockets joined in the same namespace.
    this.socket.broadcast.emit(this.method, data);

  }

  this.finished = true;
  this.emit('finish');

  // reset flags
  delete this.flags;

  return true;
};
