var expect = require('chai').expect
  , signal = require('../')
  , support = require('./support')
  , client = support.client;


var sessionCookie = support.sessionCookie;

describe('session', function() {

  beforeEach(support.startServer);
  afterEach(support.stopServer);

  describe('req.session', function() {
    it('should persist', function(done) {
      this.io.use(signal.cookieParser())
      this.io.use(signal.session({secret: 'my secret'}));
      this.io.connect(function(socket) {
        socket.on('message', function(req, res) {
          var _req = socket.request
            , session = _req.session;
          session.count = session.count || 0;
          session.count++;
          res.send(null, session.count, {'Set-Cookie': sessionCookie(_req, 'my secret')});
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('message', function(err, body, headers) {
          expect(body).to.eql(1);

          socket = client('/', {headers: {cookie: headers['Set-Cookie']}});
          socket.on('connect', function() {
            socket.emit('message', function(err, body) {
              expect(body).to.eql(2);
              done()
            });
          });
        });
      });
    });

    it('should generate on event', function(done) {
      this.io.use(signal.cookieParser())
      this.io.use(signal.session({secret: 'my secret'}));
      this.io.connect(function(socket) {
        socket.on('message', function(req, res) {
          var _req = socket.request
            , session = _req.session;

          session.count = session.count || 0;
          session.count++;
          _req.session.save(function(err) {
            if (err) throw err;
            res.send(null, session.count, {'Set-Cookie': sessionCookie(_req, 'my secret')});
          });
        });
      });

      var socket1 = client();
      socket1.on('connect', function() {
        socket1.send(function(err, body, headers) {
          expect(body).to.eql(1);
          socket2 = client('/', {headers: {cookie: headers['Set-Cookie']}});
          socket2.on('connect', function() {
            socket1.send(function(err, body) {
              expect(body).to.eql(2);
              socket2.send(function(err, body) {
                expect(body).to.eql(3);
                done();
              });
            });
          });
        });
      });
    });
  });
});


