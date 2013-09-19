
var fs = require('fs')
  , util = require('util')
  , EventEmitter = require('events').EventEmitter
  , hogan = require('hogan.js')
  , async = require('async');


module.exports = Template;

util.inherits(Template, EventEmitter);


function Template(filename, options) {
  if (!(this instanceof Template)) {
    return new Template(filename, options);
  }

  EventEmitter.call(this);

  this.filename = filename;
  this.options = options;
  this.compiled = false;
  this.data = null;
  this.template = null;
  this.compile();
}

Template.prototype.compile = function() {
  var self = this;

  fs.readFile(this.filename, function(err, data) {
    self.compiled = true;
    if (err) return self.emit('error', err);

    self.data = data;
    try {
      self.template = hogan.compile(data.toString(), self.options);
    } catch (e) {
      return self.emit('error', e);
    }
    self.emit('compile', self.template);
  });
};

Template.prototype.render = function(context, partials, indent, callback) {
  if ('function' == typeof context) {
    callback = context;
    context = null;
  } else if ('function' == typeof partials) {
    callback = partials;
    partials = null;
  } else if ('function' == typeof indent) {
    callback = indent;
    indent = null;
  }

  partials = partials || {};
  callback = callback || function() {};

  var self = this
    , _partials = {};

  async.parallel([
    this.oncompile.bind(this),
    function(callback) {
      async.each(Object.keys(partials), function(k, callback) {
        var partial = partials[k]
          , _partial = 'string' == typeof partial ? new Template(partial) : partial;

        _partial.oncompile(function(err, template) {
          _partials[k] = template;
          callback(err);
        });
      }, callback);
    }
  ], function(err) {
    if (err) return callback(err);

    var output = self.template.render(context, _partials, indent);
    callback(null, output);
  });
};

Template.prototype.oncompile = function(callback) {
  var err;
  if (this.compiled) {
    if (!this.template) {
      err = new Error('Could not compile');
    }
    return callback(err, this.template);
  }

  this.once('compile', function(template) {
    callback(null, template);
  }).once('error', callback);
};
