
var _session = require('socket.io-bundle').session
  , debug = require('debug')('signal.io:middleware/session');


exports = module.exports = session;


/**
 * Expose constructors.
 */

for (var key in _session) {
  exports[key] = _session[key];
}

function session(options) {
  var fn = _session(options);

  return function session(socket, next) {
    socket.use(exports.session);
    return fn(socket, next);
  };
}


/**
 * session middleware for event requests.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 * @api public
 */

exports.session = function(req, res, next) {
  var _req = req.request
    , session = _req.session;
  if (!session) {
    return next();
  }

  // proxy end() to commit the session
  var end = res.end;
  res.end = function(data, encoding) {
    if (!_req.session) return end.call(this, data, encoding);
    var self = this;
    debug('saving');
    _req.session.resetMaxAge();
    _req.session.save(function(err){
      if (err) console.error(err.stack);
      debug('saved');
      end.call(self, data, encoding);
    });
  };

  session.reload(function(err) {
    if (err) console.error(err.stack);
    next(err);
  });
};

