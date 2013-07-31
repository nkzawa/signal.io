
var expect = require('chai').expect
  , Request = require('../').Request;


describe('Request', function() {
  describe('.get(field)', function() {
    it('should return the header field value', function() {
      var req = new Request({request: {}});
      expect(req.get('Something-Else')).to.be.undefined;

      req.headers['Content-Type'.toLowerCase()] = 'application/json';
      expect(req.get('Content-Type')).to.equal('application/json');
    });
  });

  describe('.param(name, default)', function() {
    it('should use the default value unless defined', function() {
      var req = new Request({request: {}});
      expect(req.param('name', 'tj')).to.equal('tj');
    });
  });

  describe('.param(name)', function() {
    it('should check req.query', function() {
      var req = new Request({request: {query: {name: 'tj'}}});
      expect(req.param('name')).to.equal('tj');
    });

    it('should check req.body', function() {
      var req = new Request({request: {}});
      req.body = {name: 'tj'}
      expect(req.param('name')).to.equal('tj');
    });

    it('should check req.params', function() {
      var req = new Request({request: {}, params: {name: 'tj'}});
      expect(req.param('filter') + req.param('name')).to.equal('undefinedtj');
    });
  });

  describe('.path', function() {
    it('should return the namespace', function() {
      var req = new Request({request: {}, nsp: {name: '/login'}});
      expect(req.path).to.equal('/login');
    });
  });

  describe('.query', function(){
    it('should default to {}', function() {
      var req = new Request({request: {query: {}}});
      expect(req.query).to.eql({});
    });

    it('should contain the parsed query-string', function() {
      var req = new Request({request: {query: {user: {name: 'tj'}}}});
      expect(req.query).to.eql({user: {name: 'tj'}});
    });
  });

  describe('.route', function(){
    it('should be the executed Route', function() {
      var req = new Request({request: {}, route: {path: '/user/:id/:op?'}});
      expect(req.route.path).to.equal('/user/:id/:op?');

      var req = new Request({request: {}, route: {path: '/user/:id/:edit?'}});
      expect(req.route.path).to.equal('/user/:id/:edit?');
    });
  });
});
