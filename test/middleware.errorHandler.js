
var expect = require('chai').expect
  , signal = require('../')
  , support = require('./support')
  , client = support.client;


describe('middleware.errorHandler', function() {
  beforeEach(function(done) {
    support.startServer(this, done);
  });
  afterEach(function(done) {
    support.stopServer(this, done);
  });

  describe('status', function() {
    it('should be 500 error by default', function(done) {
      this.io.connect(function(socket) {
        socket.use(socket.dispatcher);
        socket.use(signal.errorHandler());
        socket.on('foo', function(req, res) {
          throw new Error();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo', function(err, data) {
          expect(err).to.eql({status: 500});
          done();
        });
      });
    });

    it('should be able to set', function(done) {
      this.io.connect(function(socket) {
        socket.use(socket.dispatcher);
        socket.use(signal.errorHandler());
        socket.on('foo', function(req, res) {
          res.statusCode = 400;
          throw new Error();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo', function(err, data) {
          expect(err).to.eql({status: 400});
          done();
        });
      });
    });

    it('should be able to set to an error instance', function(done) {
      this.io.connect(function(socket) {
        socket.use(socket.dispatcher);
        socket.use(signal.errorHandler());
        socket.on('foo', function(req, res) {
          var err = new Error();
          err.status = 400;
          throw err;
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo', function(err, data) {
          expect(err).to.eql({status: 400});
          done();
        });
      });
    });
  });

  it('should send error as body data', function(done) {
    this.io.connect(function(socket) {
      socket.use(socket.dispatcher);
      socket.use(signal.errorHandler());
      socket.on('foo', function(req, res) {
        throw new Error('hi');
      });
    });

    var socket = client();
    socket.on('connect', function() {
      socket.emit('foo', function(err, data) {
        expect(data).to.have.property('error');
        expect(data.error).to.have.property('message', 'hi');
        expect(data.error).to.have.property('stack');
        done();
      });
    });
  });
});
