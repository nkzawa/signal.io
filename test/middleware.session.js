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
          req.session.count = req.session.count || 0;
          req.session.count++;
          res.set('Set-Cookie', sessionCookie(req.request, 'my secret'));
          res.end(req.session.count);
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('message', function(err, body, headers) {
          expect(body).to.eql(1);

          socket = client('/', {headers: {cookie: headers['set-cookie']}});
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
          req.session.count = req.session.count || 0;
          req.session.count++;
          req.session.save(function(err) {
            if (err) throw err;
            res.set('Set-Cookie', sessionCookie(req.request, 'my secret'));
            res.end(req.session.count);
          });
        });
      });

      var socket1 = client();
      socket1.on('connect', function() {
        socket1.send(function(err, body, headers) {
          expect(body).to.eql(1);
          var socket2 = client('/', {headers: {cookie: headers['set-cookie']}});
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


