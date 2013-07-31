
var expect = require('chai').expect
  , Response = require('../').Response;

describe('Response', function() {
  describe('.get(field)', function() {
    it('should get the response header field', function() {
      var res = new Response({});
      res.setHeader('Content-Type', 'text/x-foo');
      expect(res.get('Content-Type')).to.equal('text/x-foo');
      expect(res.get('Content-type')).to.equal('text/x-foo');
      expect(res.get('content-type')).to.equal('text/x-foo');
    });
  });

  describe('.set(field, value)', function() {
    it('should set the response header field', function() {
      var res = new Response({});
      res.set('Content-Type', 'text/x-foo');
      expect(res.getHeader('Content-Type')).to.equal('text/x-foo');
    });

    it('should coerce to a string', function() {
      var res = new Response({});
      res.set('ETag', 123);
      expect(res.get('ETag')).to.equal('123');
    });
  });

  describe('.set(field, values)', function() {
    it('should set multiple response header fields', function() {
      var res = new Response({});
      res.set('Set-Cookie', ["type=ninja", "language=javascript"]);
      expect(JSON.stringify(res.get('Set-Cookie')))
          .to.equal('["type=ninja","language=javascript"]');
    });

    it('should coerce to an array of strings', function() {
      var res = new Response({});
      res.set('ETag', [123, 456]);
      expect(JSON.stringify(res.get('ETag'))).to.equal('["123","456"]');
    });
  });

  describe('.set(object)', function() {
    it('should set multiple fields', function() {
      var res = new Response({});
      res.set({
        'X-Foo': 'bar',
        'X-Bar': 'baz'
      });

      expect(res.getHeader('X-Foo')).to.equal('bar');
      expect(res.getHeader('X-Bar')).to.equal('baz');
    });

    it('should coerce to a string', function() {
      var res = new Response({});
      res.set({ ETag: 123 });
      expect(res.get('ETag')).to.equal('123');
    });
  });

  describe('.status(code)', function() {
    it('should set the response .statusCode', function() {
      var res = new Response({});
      res.status(201);
      expect(res.statusCode).to.equal(201);
    });
  });
});
