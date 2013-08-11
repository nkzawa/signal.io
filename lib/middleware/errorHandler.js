/*!
 * Signal.IO - errorHandler
 * Ported from https://github.com/senchalabs/connect
 * MIT Licensed
 */

// environment

var env = process.env.NODE_ENV || 'development';

/**
 * Error handler:
 *
 * Development error handler, providing stack traces
 * and error message responses for requests.
 *
 * @return {Function}
 * @api public
 */

exports = module.exports = function errorHandler() {
  return function errorHandler(err, req, res, next) {
    if (err.status) res.statusCode = err.status;
    if (res.statusCode < 400) res.statusCode = 500;
    if ('test' != env) console.error(err.stack);

    var error = { message: err.message, stack: err.stack };
    for (var prop in err) error[prop] = err[prop];
    var json = { error: error };
    res.send(json);
  };
};

