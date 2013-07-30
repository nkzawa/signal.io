
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

  describe('.match(nsp, i)', function() {
    it('should match based on index', function() {
      var router = this.router;
      router.route('/foo', function(){});
      router.route('/foob?', function(){});
      router.route('/bar', function(){});

      var nsp = '/foo';

      var route = router.match(nsp, 0);
      expect(route.constructor.name).to.eql('Route');
      expect(route.path).to.eql('/foo');

      var route = router.match(nsp, 1);
      expect(route.path).to.eql('/foob?');

      var route = router.match(nsp, 2);
      expect(route).to.not.be.ok;

      nsp = '/bar';
      var route = router.match(nsp);
      expect(route.path).to.eql('/bar');
    });
  });

  describe('.matchRequest(socket, i)', function() {
    it('should match based on index', function() {
      var router = this.router;
      router.route('/foo', function(){});
      router.route('/foob?', function(){});
      router.route('/bar', function(){});
      var socket = {nsp: {name: '/foo'}};

      var route = router.matchRequest(socket, 0);
      expect(route.constructor.name).to.eql('Route');
      expect(route.path).to.eql('/foo');

      var route = router.matchRequest(socket, 1);
      expect(socket._route_index).to.eql(1);
      expect(route.path).to.eql('/foob?');

      var route = router.matchRequest(socket, 2);
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
