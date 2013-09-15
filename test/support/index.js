var http = require('http')
  , url = require('url')
  , io = require('socket.io-client')
  , signal = require('../../')
  , signature = require('cookie-signature')
  , port = 8888;


exports.client = function client(path, options) {
  path = path || '';
  options = options || {};

  var uri = 'http://localhost:' + port + path;
  if (options.headers) {
    var urlObj = url.parse(uri, true);
    urlObj.query.headers = JSON.stringify(options.headers);
    uri = url.format(urlObj);
    delete options.headers
  }

  var _options = {
    path: '/signal.io',
    forceNew: true,
    reconnection: false
  };
  for (var key in options) {
    _options[key] = options[key];
  }

  return io(uri, _options);
};

exports.startServer = function(context, done) {
  context.server = http.Server();
  context.io = signal(context.server);
  context.io.use(exports.header);
  context.server.listen(port, done);

  context.sockets = [];
  context.server.on('connection', function(sockets) {
    context.sockets.push(sockets);
  });
};

exports.stopServer = function(context, done) {
  // FIXME: following doesn't work when error.
  // context.io.sockets.sockets.slice().forEach(function(socket) {
  //   socket.disconnect(true);
  // });

  context.sockets.forEach(function(socket) {
    socket.destroy();
  });
  context.server.close(done);
};

exports.header = function(socket, next) {
  var req = socket.request
    , query = url.parse(req.url, true).query
    , headers = query.headers;

  if (headers) {
    headers = JSON.parse(headers);
    for (var field in headers) {
      req.headers[field.toLowerCase()] = headers[field];
    }
  }
  next();
};

exports.sessionCookie = function(req, secret) {
  var cookie = req.session.cookie
    , val = 's:' + signature.sign(req.sessionID, secret);
  return cookie.serialize('connect.sid', val);
};
