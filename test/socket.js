var expect = require('chai').expect
  , signal = require('../')
  , support = require('./support')
  , client = support.client;


describe('Socket', function() {
  beforeEach(support.startServer);
  afterEach(support.stopServer);

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
});


