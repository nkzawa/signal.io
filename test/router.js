
var expect = require('chai').expect
  , signal = require('../')
  , support = require('./support')
  , client = support.client
  , Router = signal.Router;


describe('router', function() {
  beforeEach(function(done) {
    this.router = new Router();
    support.startServer.call(this, done);
  })
  afterEach(support.stopServer);

  describe('.match(nsp)', function() {
    it('should match (0)', function() {
      var router = this.router;
      router.route('/foo', function(){});

      var route = router.match('/foo');
      expect(route.constructor.name).to.eql('Route');
      expect(route.path).to.eql('/foo');
    });

    it('should match (1)', function() {
      var router = this.router;
      router.route('/foob?', function(){});

      var route = router.match('/foo');
      expect(route.path).to.eql('/foob?');
    });

    it('should match (2)', function() {
      var router = this.router;
      router.route('/bar', function(){});

      var route = router.match('/foo');
      expect(route).to.not.be.ok;

      var route = router.match('/bar');
      expect(route.path).to.eql('/bar');
    });
  });

  describe('.matchRequest(socket)', function() {
    it('should match (0)', function() {
      var router = this.router;
      router.route('/foo', function(){});
      var socket = {nsp: {name: '/foo'}};

      var route = router.matchRequest(socket);
      expect(route.constructor.name).to.eql('Route');
      expect(route.path).to.eql('/foo');
    });

    it('should match (1)', function() {
      var router = this.router;
      router.route('/foob?', function(){});
      var socket = {nsp: {name: '/foo'}};

      var route = router.matchRequest(socket);
      expect(route.path).to.eql('/foob?');
    });

    it('should match (2)', function() {
      var router = this.router;
      router.route('/bar', function(){});
      var socket = {nsp: {name: '/foo'}};

      var route = router.matchRequest(socket);
      expect(route).to.not.be.ok;

      socket.nsp.name = '/bar';
      var route = router.matchRequest(socket);
      expect(route.path).to.eql('/bar');
    });
  });

  describe('.middleware', function() {
    it('should dispatch', function(done) {
      this.io._router.route('/foo', function(socket) {
        socket.send('foo');
      });

      this.io.use(this.router.middleware);

      var socket = client('/foo');
      socket.on('message', function(data) {
        expect(data).to.eql('foo');
        done();
      });
    });
  });

  describe('.multiple callbacks', function(){
    it('should throw if a callback is null', function(){
      var router = this.router;
      expect(function() {
        router.route('/foo', null, function(){});
      }).to.throw(Error);
    });

    it('should throw if a callback is undefined', function(){
      var router = this.router;
      expect(function() {
        router.route('/foo', undefined, function(){});
      }).to.throw(Error);
    });

    it('should throw if a callback is not a function', function(){
      var router = this.router;
      expect(function() {
        router.route('/foo', 'not a function', function(){});
      }).to.throw(Error);
    });

    it('should not throw if all callbacks are functions', function(){
      this.router.route('/foo', function(){}, function(){});
    });
  });
});
