
var expect = require('chai').expect
  , utils = require('../lib/utils');


describe('utils.flatten(arr)', function() {
  it('should flatten an array', function() {
    var arr = ['one', ['two', ['three', 'four'], 'five']];
    expect(utils.flatten(arr))
      .to.eql(['one', 'two', 'three', 'four', 'five']);
  });
});

