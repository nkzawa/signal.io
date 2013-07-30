var Namespace = require('socket.io/lib/namespace');


module.exports = Namespace;

// proxy `run` to attach the router.
var run = Namespace.prototype.run;

Namespace.prototype.run = function() {
  if (!this._usedRouter) {
    this._usedRouter = true;
    this.use(this.server.router);
  }

  run.apply(this, arguments);
};

