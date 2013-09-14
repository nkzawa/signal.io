var expect = require('chai').expect
  , http = require('http')
  , signal = require('../')
  , support = require('./support')
  , client = support.client;


describe('Server', function() {
  it('should be created with no argument', function(done) {
    var server = http.Server();
    var io = new signal.Server();
    io.attach(server);
    server.listen(8888, function() {
      server.close(done);
    });
  });

  it('should be created with only options', function(done) {
    var server = http.Server();
    var io = new signal.Server({});
    io.attach(server);
    server.listen(8888, function() {
      server.close(done);
    });
  });

  describe('when it started', function() {
    beforeEach(support.startServer);
    afterEach(support.stopServer);

    describe('.param(fn)', function() {
      it('should map app.param(name, ...) logic', function(done) {
        this.io.param(function(name, regexp) {
          if (Object.prototype.toString.call(regexp) == '[object RegExp]') {
            return function(socket, next, val) {
              var captures;
              if (captures = regexp.exec(String(val))) {
                socket.params[name] = captures[1];
                next();
              } else {
                var err = new Error();
                err.status = 404;
                next({data: err});
              }
            };
          }
        });

        this.io.param(':name', /^([a-zA-Z]+)$/);

        this.io.connect('/user/:name', function(socket) {
          socket.send(socket.params.name);
        });

        var socket = client('/user/tj');
        socket.on('message', function(data) {
          expect(data).to.equal('tj');

          var socket = client('/user/123');
          socket.once('error', function(err) {
            expect(err).to.have.property('status', 404);
            done();
          });
        });
      });
    });

    describe('.param(names, fn)', function() {
      it('should map the array', function(done) {
        this.io.param(['id', 'uid'], function(socket, next, id) {
          id = Number(id);
          if (isNaN(id)) return next('route');
          socket.params.id = id;
          next();
        });

        this.io.connect('/post/:id', function(socket) {
          var id = socket.params.id;
          expect(id).to.be.a('number');
          socket.send('' + id);
        });

        this.io.connect('/user/:uid', function(socket) {
          var id = socket.params.id;
          expect(id).to.be.a('number');
          socket.send('' + id);
        });

        var socket = client('/user/123');
        socket.on('message', function(data) {
          expect(data).to.equal('123');

          var socket = client('/post/123');
          socket.on('message', function(data) {
            expect(data).to.equal('123');
            done();
          });
        });
      });
    });

    describe('.param(name, fn)', function() {
      it('should map logic for a single param', function(done) {
        this.io.param('id', function(socket, next, id) {
          id = Number(id);
          if (isNaN(id)) return next('route');
          socket.params.id = id;
          next();
        });

        this.io.connect('/user/:id', function(socket) {
          var id = socket.params.id;
          expect(id).to.be.a('number');
          socket.send('' + id);
        });

        var socket = client('/user/123');
        socket.on('message', function(data) {
          expect(data).to.equal('123');
          done();
        });
      });
    });
  });
});


