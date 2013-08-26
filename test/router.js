
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

  it('should decode params', function(done) {
    this.io.connect('/:name', function(socket) {
      socket.send(socket.params.name);
    });

    var socket = client('/foo%2Fbar');
    socket.on('message', function(data) {
      expect(data).to.equal('foo/bar');
      done();
    });
  });

  describe('when given a regexp', function() {
    it('should match the pathname only', function(done) {
      this.io.connect(/^\/user\/([0-9]+)$/, function(socket) {
        done();
      });
      client('/user/12');
    });

    it('should populate req.params with the captures', function(done) {
      this.io.connect(/^\/user\/([0-9]+)\/(view|edit)?$/, function(socket) {
        var id = socket.params.shift()
          , op = socket.params.shift();
        socket.send(op + 'ing user ' + id);
      });

      var socket = client('/user/10/edit');
      socket.on('message', function(data) {
        expect(data).to.equal('editing user 10');
        done();
      });
    });
  });

  it('should allow escaped regexp', function(done) {
    this.io.connect('/user/\\d+', function(socket) {});

    var socket1 = client('/user/10');
    socket1.on('connect', function() {
      var socket2 = client('/user/tj');
      socket2.once('error', function(err) {
        expect(err).to.have.property('status', 404);
        done();
      });
    });
  });

  it('should allow literal "."', function(done) {
    this.io.connect('/api/users/:from..:to', function(socket) {
      var from = socket.params.from
        , to = socket.params.to;
      socket.send('users from ' + from + ' to ' + to);
    });

    var socket = client('/api/users/1..50');
    socket.on('message', function(data) {
      expect(data).to.equal('users from 1 to 50');
      done();
    });
  })

  describe('*', function() {
    it('should denote a greedy capture group', function(done) {
      this.io.connect('/user/*.json', function(socket) {
        socket.send(socket.params[0]);
      });

      var socket = client('/user/tj.json');
      socket.on('message', function(data) {
        expect(data).to.equal('tj');
        done();
      });
    })

    it('should work with several', function(done) {
      this.io.connect('/api/*.*', function(socket) {
        var resource = socket.params.shift()
          , format = socket.params.shift();
        socket.send(resource + ' as ' + format);
      });

      var socket = client('/api/users/foo.bar.json');
      socket.on('message', function(data) {
        expect(data).to.equal('users/foo.bar as json');
        done();
      });
    })

    it('should work cross-segment', function(done) {
      this.io.connect('/api*', function(socket) {
        socket.send(socket.params[0]);
      });

      var socket1 = client('/api');
      socket1.on('message', function(data) {
        expect(data).to.equal('');

        var socket2 = client('/api/hey');
        socket2.on('message', function(data) {
          expect(data).to.equal('/hey');
          done();
        });
      });
    })

    it('should allow naming', function(done) {
      this.io.connect('/api/:resource(*)', function(socket) {
        var resource = socket.params.resource;
        socket.send(resource);
      });

      var socket = client('/api/users/0.json');
      socket.on('message', function(data) {
        expect(data).to.equal('users/0.json');
        done();
      });
    });

    it('should not be greedy immediately after param', function(done) {
      this.io.connect('/user/:user*', function(socket) {
        socket.send(socket.params.user);
      });

      var socket = client('/user/122');
      socket.on('message', function(data) {
        expect(data).equal('122');
        done();
      });
    });

    it('should eat everything after /', function(done) {
      this.io.connect('/user/:user*', function(socket) {
        socket.send(socket.params.user);
      });

      var socket = client('/user/122/aaa');
      socket.on('message', function(data) {
        expect(data).equal('122');
        done();
      });
    });

    it('should span multiple segments', function(done) {
      this.io.connect('/file/*', function(socket) {
        socket.send(socket.params[0]);
      });

      var socket = client('/file/javascripts/jquery.js');
      socket.on('message', function(data) {
        expect(data).equal('javascripts/jquery.js');
        done();
      });
    });

    it('should be optional', function(done) {
      this.io.connect('/file/*', function(socket) {
        socket.send(socket.params[0]);
      });

      var socket = client('/file/');
      socket.on('message', function(data) {
        expect(data).equal('');
        done();
      });
    })

    it('should require a preceeding /', function(done) {
      this.io.connect('/file/*', function(socket) {
        socket.send(socket.params[0]);
      });

      var socket = client('/file');
      socket.once('error', function(err) {
        expect(err).to.have.property('status', 404);
        done();
      });
    });
  });

  describe(':name', function() {
    it('should denote a capture group', function(done) {
      this.io.connect('/user/:user', function(socket) {
        socket.send(socket.params.user);
      });

      var socket = client('/user/tj');
      socket.on('message', function(data) {
        expect(data).to.equal('tj');
        done();
      });
    });

    it('should match a single segment only', function(done) {
      this.io.connect('/user/:user', function(socket) {
        socket.send(socket.params.user);
      });

      var socket = client('/user/tj/edit');
      socket.once('error', function(err) {
        expect(err).to.have.property('status', 404);
        done();
      });
    });

    it('should allow several capture groups', function(done) {
      this.io.connect('/user/:user/:op', function(socket) {
        socket.send(socket.params.op + 'ing ' + socket.params.user);
      });

      var socket = client('/user/tj/edit');
      socket.on('message', function(data) {
        expect(data).to.equal('editing tj');
        done();
      });
    });
  });

  describe(':name?', function() {
    it('should denote an optional capture group', function(done) {
      this.io.connect('/user/:user/:op?', function(socket) {
        var op = socket.params.op || 'view';
        socket.send(op + 'ing ' + socket.params.user);
      });

      var socket = client('/user/tj');
      socket.on('message', function(data) {
        expect(data).to.equal('viewing tj');
        done();
      });
    });

    it('should populate the capture group', function(done) {
      this.io.connect('/user/:user/:op?', function(socket) {
        var op = socket.params.op || 'view';
        socket.send(op + 'ing ' + socket.params.user);
      });

      var socket = client('/user/tj/edit');
      socket.on('message', function(data) {
        expect(data).to.equal('editing tj');
        done();
      });
    });
  });

  describe('.:name', function() {
    it('should denote a format', function(done) {
      this.io.connect('/:name.:format', function(socket) {
        socket.send(socket.params.name + ' as ' + socket.params.format);
      });

      var socket = client('/foo.json');
      socket.on('message', function(data) {
        expect(data).to.equal('foo as json');

        var socket = client('/foo');
        socket.once('error', function(err) {
          expect(err).to.have.property('status', 404);
          done();
        });
      });
    });
  });

  describe('.:name?', function() {
    it('should denote an optional format', function(done) {
      this.io.connect('/:name.:format?', function(socket) {
        socket.send(socket.params.name + ' as ' + (socket.params.format || 'html'));
      });

      var socket = client('/foo');
      socket.on('message', function(data) {
        expect(data).to.equal('foo as html');

        var socket = client('/foo.json');
        socket.on('message', function(data) {
          expect(data).to.equal('foo as json');
          done();
        });
      });
    });
  });

  it('should be chainable', function() {
    expect(this.io.connect(function() {})).to.equal(this.io);
    expect(this.io.connect('/', function() {})).to.equal(this.io);
  });

  describe('app.routes', function() {
    it('should be initialized', function() {
      expect(this.io.routes).to.eql([]);
    });

    it('should be populated with routes', function() {
      this.io.connect('/', function(socket) {});
      this.io.connect('/user/:id', function(socket) {});

      var routes = this.io.routes;
      expect(routes).to.have.length(2);

      expect(routes[0].path).to.equal('/');
      expect(routes[0].regexp.toString()).to.equal('/^\\/$/');

      expect(routes[1].path).to.equal('/user/:id');
    });

    it('should be mutable', function(done) {
      this.io.connect('/', function(socket) {});
      this.io.connect('/user/:id', function(socket) {});

      var routes = this.io.routes;
      expect(routes).to.have.length(2);

      expect(routes[0].path).to.equal('/');
      expect(routes[0].regexp.toString()).to.equal('/^\\/$/');

      routes.splice(1);

      var socket = client('/user/12');
      socket.once('error', function(err) {
        expect(err).to.have.property('status', 404);
        done();
      });
    });
  });

  describe('app.routes.error', function() {
    it('should only call an error handling routing callback when an error is propagated', function(done) {
      var a = false;
      var b = false;
      var c = false;
      var d = false;

      this.io.connect('/', function(socket, next) {
        next(new Error('fabricated error'));
      }, function(socket, next) {
        a = true;
        next();
      }, function(err, socket, next) {
        b = true;
        expect(err.message).to.equal('fabricated error');
        next(err);
      }, function(err, socket, next) {
        c = true;
        expect(err.message).to.equal('fabricated error');
        next();
      }, function(err, socket, next) {
        d = true;
        next();
      }, function(socket) {
        expect(a).to.be.false;
        expect(b).to.be.true;
        expect(c).to.be.true;
        expect(d).to.be.false;
        done();
      });
      client('/');
    });
  });
});
