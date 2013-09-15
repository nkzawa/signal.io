
var expect = require('chai').expect
  , signal = require('../')
  , support = require('./support')
  , client = support.client;


describe('middleware.timeout', function() {
  beforeEach(function(done) {
    support.startServer(this, done);
  });
  afterEach(function(done) {
    support.stopServer(this, done);
  });

  describe('when below the timeout', function() {
    it('should do nothing', function(done) {
      this.io.connect(function(socket) {
        socket.use(signal.timeout(300));
        socket.on('greeting', function(req, res) {
          res.end('Hello');
        });
      });
      var socket = client();
      socket.emit('greeting', function(err, data) {
        expect(data).to.equal('Hello');
        done();
      });
    });
  });

  describe('when above the timeout', function() {
    describe('with no response made', function() {
      it('should respond with 408 Request timeout', function(done) {
        this.io.connect(function(socket) {
          socket.use(signal.timeout(300));
          socket.on('greeting', function(req, res) {
            setTimeout(function() {
              res.end('Hello');
            }, 400);
          });
        });
        var socket = client();
        socket.emit('greeting', function(err, data) {
          expect(err).to.have.property('status', 503);
          done();
        });
      });

      it('should pass the error to next()', function(done) {
        this.io.connect(function(socket) {
          socket
            .use(signal.timeout(300))
            .use(function(req, res) {
              setTimeout(function(){
                res.end('Hello');
              }, 400);
            })
            .use(function(err, req, res, next) {
              res.statusCode = err.status;
              res.end('timeout of ' + err.timeout + 'ms exceeded');
            });
        });
        var socket = client();
        socket.emit('greeting', function(err, data) {
          expect(data).to.equal('timeout of 300ms exceeded');
          done();
        });
      });
    });
  });

  describe('req.clearTimeout()', function() {
    it('should revert this behavior', function(done) {
      this.io.connect(function(socket) {
        socket
          .use(signal.timeout(300))
          .use(function(req, res) {
            req.clearTimeout();
            setTimeout(function() {
              res.end('Hello');
            }, 400);
          });
      });
      var socket = client();
      socket.emit('greeting', function(err, data) {
        expect(data).to.equal('Hello');
        done();
      });
    });
  });
});
