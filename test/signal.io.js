var expect = require('chai').expect
  , signal = require('../');


describe('signal.io', function() {

  it('should export constructors', function() {
    expect(signal.Server).to.be.a('function');
    expect(signal.Namespace).to.be.a('function');
    expect(signal.Socket).to.be.a('function');
    expect(signal.Route).to.be.a('function');
    expect(signal.Router).to.be.a('function');
    expect(signal.Request).to.be.a('function');
    expect(signal.Response).to.be.a('function');
  });

  it('should export middlewares', function() {
    expect(signal.cookieParser).to.be.a('function');
    expect(signal.session).to.be.a('function');
    expect(signal.csrf).to.be.a('function');
    expect(signal.logger).to.be.a('function');
    expect(signal.errorHandler).to.be.a('function');
    expect(signal.timeout).to.be.a('function');
  });

  it('should set default path', function() {
    var io = signal();
    expect(io._path).to.eql('/signal.io');
  });
});


