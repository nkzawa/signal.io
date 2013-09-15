
var expect = require('chai').expect
  , Request = require('../').Request
  , support = require('./support')
  , client = support.client;


describe('Request', function() {
  beforeEach(function(done) {
    support.startServer(this, done);
  });
  afterEach(function(done) {
    support.stopServer(this, done);
  });

  describe('properties', function() {
    it('should be exposed', function(done) {
      this.io.connect('/foo', function(socket) {
        socket.on('bar', function(req, res) {
          expect(req.url).to.eql('/foo');
          expect(req.method).to.eql('bar');
          expect(req.body).to.eql('body');
          expect(req.headers).to.eql({header: 'hi'});
          expect(req.socket).to.equal(socket);
          expect(req.request).to.equal(socket.request);
          expect(req.query).to.equal(socket.request.query);
          expect(req.route).to.equal(socket.route);
          expect(req.params).to.equal(socket.params);
          done();
        });
      });

      var socket = client('/foo');
      socket.on('connect', function() {
        socket.emit('bar', 'body', {header: 'hi'});
      });
    });
  });

  describe('.get(field)', function() {
    it('should return the header field value', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          expect(req.get('Something-Else')).to.be.undefined;
          expect(req.get('Content-Type')).to.equal('application/json');
          done();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo', null, {'Content-Type': 'application/json'});
      });
    });
  });

  describe('.param(name, default)', function() {
    it('should use the default value unless defined', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          expect(req.param('name', 'tj')).to.equal('tj');
          done();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo');
      });
    });
  });

  describe('.param(name)', function() {
    it('should check req.query', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          expect(req.param('name')).to.equal('tj');
          done();
        });
      });

      var socket = client('/?name=tj');
      socket.on('connect', function() {
        socket.emit('foo');
      });
    });

    it('should check req.body', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          expect(req.param('name')).to.equal('tj');
          done();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo', {name: 'tj'});
      });
    });

    it('should check req.params', function(done) {
      this.io.connect('/user/:name', function(socket) {
        socket.on('foo', function(req, res) {
          expect(req.param('filter') + req.param('name')).to.equal('undefinedtj');
          done();
        });
      });

      var socket = client('/user/tj');
      socket.on('connect', function() {
        socket.emit('foo');
      });
    });
  });

  describe('.path', function() {
    it('should return the namespace', function(done) {
      this.io.connect('/login', function(socket) {
        socket.on('foo', function(req, res) {
          expect(req.path).to.equal('/login');
          done();
        });
      });

      var socket = client('/login?redirect=/post/1/comments');
      socket.on('connect', function() {
        socket.emit('foo');
      });
    });
  });

  describe('.query', function() {
    it('should default to {}', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          expect(req.query).to.eql({EIO: '2', transport: 'polling'});
          done();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo');
      });
    });

    it('should contain the parsed query-string', function(done) {
      this.io.connect(function(socket) {
        socket.on('foo', function(req, res) {
          expect(req.query).to.have.property('user[name]', 'tj');
          done();
        });
      });

      var socket = client('/?user[name]=tj');
      socket.on('connect', function() {
        socket.emit('foo');
      });
    });
  });

  describe('.route', function() {
    it('should be the executed Route', function(done) {
      this.io.connect('/user/:id/:op?', function(socket) {
        socket.on('foo', function(req, res) {
          expect(req.route.path).to.equal('/user/:id/:op?');
          done();
        });
      });

      var socket = client('/user/12/edit');
      socket.on('connect', function() {
        socket.emit('foo');
      });
    });
  });
});
