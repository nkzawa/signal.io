
var expect = require('chai').expect
  , support = require('./support')
  , client = support.client;


describe('Response', function() {
  beforeEach(support.startServer);
  afterEach(support.stopServer);

  describe('properties', function() {
    it('should be normalized', function(done) {
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
    it('should set the response .statusCode', function() {
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
});
