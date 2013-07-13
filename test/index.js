var expect = require('chai').expect
  , async = require('async')
  , signal = require('../')
  , support = require('./support')
  , client = support.client
  , port = 8888;


function times(n, callback) {
  return function(err) {
    if (err) return callback(err);
    --n || callback();
  }
}

describe('signal.io', function() {

  beforeEach(support.startServer);
  afterEach(support.stopServer);

  describe('middleware', function() {
    it('should work', function(done) {
      this.io.use(function(socket, next) {
        socket.foo = 1;
        next();
      });
      this.io.connect(function(socket) {
        expect(socket.foo).to.eql(1);
        done();
      });
      client();
    });
  });

  describe('event middleware', function() {
    it('should work', function(done) {
      this.io.connect(function(socket) {
        socket.use(function(socket, req, res, next) {
          req.test = 'test';
          next();
        });
        socket.use(signal.errorHandler());

        socket.on('foo', function(socket, req, res) {
          expect(req.body).to.eql('hi');
          expect(req.test).to.eql('test');
          done();
        });
      });

      var socket = client();
      socket.on('connect', function() {
        socket.emit('foo', 'hi');
      });
    });
  });

  describe('connection', function() {
    it('should work', function(done) {
      this.io.connect('/messages', function(socket) {
        socket.on('index', function(socket, req, res) {
          res.send(null, ['foo', 'bar']);
        });
      });

      var socket = client('/messages');
      socket.on('connect', function() {
        socket.emit('index', function(err, body, headers) {
          expect(err).to.be.null;
          expect(body).to.eql(['foo', 'bar']);
          done();
        });
      });
    });

    it('should be able to broadcast', function(done) {
      function create(socket, req, res) {
        var text = req.body;
        res.send(null, {id: 1, text: text});
      }

      this.io.connect('/messages', function(socket) {
        socket.broadcast.on('create', create);
      });

      var socket1 = client('/messages');
      var socket2 = client('/messages');
      var end = times(2, done);

      socket2.on('create', function(body, headers) {
        expect(body).to.eql({id: 1, text: 'woot'});
        end();
      });

      function onconnect(socket, callback) {
        socket.on('connect', callback);
      }

      async.each([socket1, socket2], onconnect, function(err) {
        socket1.emit('create', 'woot', function(err, body, headers) {
          expect(body).to.eql({id: 1, text: 'woot'});
          end();
        });
      });
    });
  });

  describe('namespace', function() {
    it('should work', function(done) {
      var self = this;
      this.io.connect('/messages', function(socket) {
        self.io.of('/messages').emit('create', {id: 1, text: 'woot'});
      });

      var socket = client('/messages');
      socket.on('create', function(body, headers) {
        expect(body).to.eql({id: 1, text: 'woot'});
        done();
      });
    });

    it('should be able to handle parameteried namespaces', function(done) {
      var self = this;
      this.io.connect('/users/:id', function(socket) {
        expect(socket.params.id).to.eql('10');
        expect(socket.nsp.name).to.eql('/users/10');
        self.io.of(socket.nsp.name).emit('greeting', {text: 'hi'});
      });

      var socket = client('/users/10');
      socket.on('greeting', function(body, headers) {
        expect(body).to.eql({text: 'hi'});
        done();
      });
    });
  });

  describe('param', function() {
    it('should be able to hook', function(done) {
      var self = this;
      this.io.param('id', function(socket, next, id) {
        socket.user = {id: id, name: 'alice'};
        next();
      });
      this.io.connect('/users/:id', function(socket) {
        expect(socket.user).to.eql({id: '10', name: 'alice'});
        socket.emit('message');
      });

      var socket = client('/users/10');
      socket.on('message', done);
    });
  });
});


