var fs = require('fs')
  , path = require('path')
  , bundle = require('socket.io-bundle')
  , Server = require('./server')
  , Namespace = require('./namespace')
  , Socket = require('./socket')
  , Route = require('./router/route')
  , Router = require('./router')
  , Request = require('./request')
  , Response = require('./response');


exports = module.exports = createServer;


function createServer(srv, opts) {
  return new Server(srv, opts);
}

/**
 * Expose constructors.
 */

exports.Namespace = Namespace;
exports.Socket = Socket;
exports.Route = Route;
exports.Router = Router;
exports.Request = Request;
exports.Response = Response;

/**
 * Expose middlewares.
 */

fs.readdirSync(__dirname + '/middleware').forEach(function(filename) {
  if (!/\.js$/.test(filename)) return;

  var name = path.basename(filename, '.js');
  exports.__defineGetter__(name, function() {
    return require('./middleware/' + name);
  });
});

/**
 * Expose socket.io-bundle middlewares.
 */

for (var key in bundle) {
  if (key in exports) continue;

  Object.defineProperty(
      exports
    , key
    , Object.getOwnPropertyDescriptor(bundle, key));
}

