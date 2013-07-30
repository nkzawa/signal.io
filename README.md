# Signal.IO
[![Build Status](https://travis-ci.org/nkzawa/signal.io.png?branch=master)](https://travis-ci.org/nkzawa/signal.io)
[![NPM version](https://badge.fury.io/js/signal.io.png)](http://badge.fury.io/js/signal.io)

Signal.IO is a realtime application framewrork for building Web API based on WebSocket instead of HTTP.

```js
var signal = require('signal.io');
var server = require('http').Server();
var io = signal(server);

io.connect('/', function(socket) {
  socket.on('get', function(req, res) {
    res.send('Hello World');
  });
});

server.listen(3000);
```

## Installation
    $ npm install signal.io

## Features
* Built on [Socket.IO](https://github.com/learnboost/socket.io) v1.0
* Parameterized namespace routing
* Bundled middlewares
* Easy broadcasting

## Example

**Server:**
```js
var signal = require('signal.io');
var server = require('http').Server();
var io = signal(server);

// set middlewares
io.use(signal.cookieParser());
io.use(signal.session('my secret'));

io.connect('/posts/:postId', function(socket) {
  console.log(socket.params.postId);

  socket.on('read', function(req, res) {
    var post = 'A post';
    res.send(post);
  });

  socket.on('create', function(req, res) {
    var newPost = req.body;

    // broadcast data to all sockets joined in the same namespace.
    res.broadcast.send(newPost);
  });
});

server.listen(3000);
```

**Client:**

Use Socket.IO as the client.

```html
<script src="/signal.io/socket.io.js"></script>
<script>
var socket = io('http://localhost:3000/posts/10', {path: '/signal.io'});
socket.on('connect', function() {
  socket.emit('read', function(err, post) {
    console.log('Read a post', post);
  });

  var post = {title: 'Hello, World'}
  socket.emit('create', post, function(err, post) {
    console.log('Created a post', post);
  });

  socket.on('create', function(post) {
    console.log('Received a broadcasted post data', post);
  });
});
</script>
```

## License
MIT

