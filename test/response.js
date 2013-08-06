
var expect = require('chai').expect
  , support = require('./support')
  , async = require('async')
  , client = support.client;


describe('Response', function() {
  beforeEach(support.startServer);
  afterEach(support.stopServer);

  describe('properties', function() {
    it('should be exposed', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          expect(res.method).to.eql('foo');
          expect(res.socket).to.equal(socket);
          done();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo');
      });
    });
  });

  describe('.get(field)', function() {
    it('should get the response header field', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          res.setHeader('Content-Type', 'text/x-foo');
          expect(res.get('Content-Type')).to.equal('text/x-foo');
          expect(res.get('Content-type')).to.equal('text/x-foo');
          expect(res.get('content-type')).to.equal('text/x-foo');
          done();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo');
      });
    });
  });

  describe('.set(field, value)', function() {
    it('should set the response header field', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          res.set('Content-Type', 'text/x-foo');
          res.send();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo', function(err, body, headers) {
          expect(headers).to.have.property('content-type', 'text/x-foo');
          done();
        });
      });
    });

    it('should coerce to a string', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          res.set('ETag', 123);
          expect(res.get('ETag')).to.equal('123');
          done();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo')
      });
    });
  });

  describe('.set(field, values)', function() {
    it('should set multiple response header fields', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          res.set('Set-Cookie', ["type=ninja", "language=javascript"]);
          res.send(JSON.stringify(res.get('Set-Cookie')));
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo', function(err, data) {
          expect(data).to.equal('["type=ninja","language=javascript"]');
          done();
        });
      });
    });

    it('should coerce to an array of strings', function() {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          res.set('ETag', [123, 456]);
          expect(JSON.stringify(res.get('ETag'))).to.equal('["123","456"]');
          done();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo');
      });
    });
  });

  describe('.set(object)', function() {
    it('should set multiple fields', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          res.set({
            'X-Foo': 'bar',
            'X-Bar': 'baz'
          });
          res.send();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo', function(err, data, headers) {
          expect(headers).to.have.property('x-foo', 'bar');
          expect(headers).to.have.property('x-bar', 'baz');
          done();
        });
      });
    });

    it('should coerce to a string', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          res.set({ ETag: 123 });
          expect(res.get('ETag')).to.equal('123');
          done();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo');
      });
    });
  });

  describe('.status(code)', function() {
    it('should set the response .statusCode', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          res.status(201);
          expect(res.statusCode).to.equal(201);
          done();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo');
      });
    });
  });

  describe('.to(name)', function() {
    it('should broadcast only to the room', function(done) {
      this.io.connect(function(socket) {
        socket.on('join', function(req, res) {
          socket.join('foo', res.send.bind(res));
        });

        socket.on('broadcast', function(req, res) {
          res.broadcast.to('foo').send(req.body);
        });
      });

      var socket1 = client();
      var socket2 = client();
      var socket3 = client();

      async.each([socket1, socket2, socket3], function(socket, callback) {
        socket.on('connect', callback);
      }, function(err) {
        if (err) throw err;

        socket2.emit('join', function(err) {
          if (err) throw err;

          socket1.emit('broadcast', 'woot', function(err, body) {
            expect(body).to.eql('woot');
          });

          socket2.on('broadcast', function(body) {
            expect(body).to.eql('woot');
            done();
          });

          socket3.on('broadcast', function() {
            throw new Error('Called unexpectedly');
          });
        });
      });
    });
  });

  describe('.send(status)', function() {
    it('should send error as a response', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          res.send(500);
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo', function(err) {
          expect(err).to.eql({status: 500});
          done();
        });
      });
    });
  });
});
