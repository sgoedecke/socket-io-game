var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var engine = require('./public/game')

var gameInterval, updateInterval

// TODO: extract below

function gameLoop() {
  // move everyone around
  Object.keys(engine.players).forEach((playerId) => {
    let player = engine.players[playerId]
    engine.movePlayer(playerId)
  })
}

// ----------------------------------------
// Main server code
// ----------------------------------------

// serve css and js
app.use(express.static('public'))

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});



function emitUpdates() {
  // tell everyone what's up
  io.emit('gameStateUpdate', engine.players);
}

io.on('connection', function(socket){
  console.log('User connected: ', socket.id)
    console.log(engine)

  // start game if this is the first player
  if (Object.keys(engine.players).length == 0) {
  	gameInterval = setInterval(gameLoop, 25)
    updateInterval = setInterval(emitUpdates, 40)
	}
  // add player to engine.players obj
  engine.players[socket.id] = {
  	accel: {
  		x: 1,
  		y: 0
  	},
  	x: 0,
    y: 0,
  	colour: engine.stringToColour(socket.id),
  	score: 0
  }

  // set socket listeners

  socket.on('disconnect', function() {
  	delete engine.players[socket.id]
  	// end game if there are no engine.players left
  	if (Object.keys(engine.players).length > 0) {
    	io.emit('gameStateUpdate', engine.players);
  	} else {
  		clearInterval(gameInterval)
      clearInterval(updateInterval)
  	}
  })

  socket.on('up', function(msg){
    engine.accelPlayer(socket.id, 0, -1)
  });

  socket.on('down', function(msg) {
    engine.accelPlayer(socket.id, 0, 1)
  })

  socket.on('left', function(msg){
    engine.accelPlayer(socket.id, -1, 0)
  });

  socket.on('right', function(msg) {
    engine.accelPlayer(socket.id, 1, 0)
  })
});

http.listen(process.env.PORT || 8080, function(){
  console.log('listening on *:8080', process.env.PORT);
});
