# Signal.IO
[![Build Status](https://travis-ci.org/nkzawa/signal.io.png?branch=master)](https://travis-ci.org/nkzawa/signal.io)

Signal.IO is a realtime web application framwrork for creating Web API based on Websocket instead of Http.

### Server:
```js
var signal = require('signal.io');
var server = require('http').Server();
var io = signal(server);

io.use(signal.cookieParser());
io.use(signal.session('my secret'));

io.connect('/posts/:postId', function(socket) {
  console.log(socket.params.postId);

  socket.on('read', function(socket, req, res) {
    var post = 'A post';
    res.send(null, post);
  });

  socket.broadcast.on('create', function(socket, req, res) {
    var newPost = req.body;

    // broadcast to all sockets joined in the same namespace.
    res.send(null, newPost);
  });
});

server.listen(3000);
```

### Client:
```js
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

