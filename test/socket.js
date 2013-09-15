var expect = require('chai').expect
  , signal = require('../')
  , support = require('./support')
  , client = support.client;


describe('Socket', function() {
  beforeEach(function(done) {
    support.startServer(this, done);
  });
  afterEach(function(done) {
    support.stopServer(this, done);
  });

  describe('.handle', function() {
    it('should match the method name only ', function(done) {
      this.io.connect('/foo', function(socket) {
        socket.on('bar', function(req, res) {
          res.send('ok');
        });
      });

      var socket1 = client('/foo');
      socket1.on('connect', function() {
        socket1.emit('bar', function(err, data) {
          expect(data).to.equal('ok');

          var socket2 = client('/foo');
          socket2.on('connect', function() {
            socket2.emit('baz', function(err, data) {
              expect(err).to.have.property('status', 405);
              done();
            });
          });
        });
      });
    });
  });

  describe('.on', function() {
    describe('multiple callbacks', function() {
      it('should throw if a callback is null', function(done) {
        this.io.connect(function(socket) {
          expect(function() {
            socket.on('foo', null, function() {});
          }).to.throw(Error);
          done();
        });
        client();
      });

      it('should throw if a callback is undefined', function(done) {
        this.io.connect(function(socket) {
          expect(function() {
            socket.on('foo', undefined, function() {});
          }).to.throw(Error);
          done();
        });
        client();
      });

      it('should throw if a callback is not a function', function(done) {
        this.io.connect(function(socket) {
          expect(function() {
            socket.on('foo', 'not a function', function() {});
          }).to.throw(Error);
          done();
        });
        client();
      });

      it('should not throw if all callbacks are functions', function(done) {
        this.io.connect(function(socket) {
          socket.on('foo', function() {}, function() {});
          done();
        });
        client();
      });
    });

    it('should be chainable', function(done) {
      this.io.connect(function(socket) {
        expect(socket.on('foo', function() {})).to.equal(socket);
        expect(socket.on('error', function() {})).to.equal(socket);
        done();
      });
      client();
    });

    it('should only call an error handling callback when an error is propagated', function(done) {
      var a = false;
      var b = false;
      var c = false;
      var d = false;

      this.io.connect('/', function(socket) {
        socket.on('foo', function(req, res, next) {
          next(new Error('fabricated error'));
        }, function(req, res, next) {
          a = true;
          next();
        }, function(err, req, res, next) {
          b = true;
          expect(err.message).to.equal('fabricated error');
          next(err);
        }, function(err, req, res, next) {
          c = true;
          expect(err.message).to.equal('fabricated error');
          next();
        }, function(err, req, res, next) {
          d = true;
          next();
        }, function(req, res) {
          expect(a).to.be.false;
          expect(b).to.be.true;
          expect(c).to.be.true;
          expect(d).to.be.false;
          done();
        });
      });
      var socket = client('/');
      socket.on('connect', function() {
        socket.emit('foo');
      });
    });
  });
});


