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

exports.startServer = function(done) {
  this.server = http.Server();
  this.io = signal(this.server);
  this.io.use(exports.header);
  this.server.listen(port, done);

  var self = this;

  this.sockets = [];
  this.server.on('connection', function(sockets) {
    self.sockets.push(sockets);
  });
};

exports.stopServer = function(done) {
  // FIXME: following doesn't work when error.
  // this.io.sockets.sockets.slice().forEach(function(socket) {
  //   socket.disconnect(true);
  // });

  this.sockets.forEach(function(socket) {
    socket.destroy();
  });
  this.server.close(done);
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
