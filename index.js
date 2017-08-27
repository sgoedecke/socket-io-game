var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// ----------------------------------------
// Main server code
// ----------------------------------------

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

const players = {}

const gameSize = 500; // 500-tile grid of possible locations

function isInBounds(pos) {
	return pos >= 0 && pos <= 500
}

function isAcceptableVel(vel) {
	return vel >= -5 && vel <= 5
}

function movePlayer(id, x, y) {
	var newHeight = players[id].height + y
	var newWidth = players[id].width + x
	if (isInBounds(newHeight) && isInBounds(newWidth)) {
    players[id].height = newHeight
    players[id].width = newWidth
	} else {
		// kill all velocity on collision
    players[id].velX = 0
    players[id].velY = 0
	}
}

function accelPlayer(id, x, y) {
	var newVelX = players[id].velX + x
	var newVelY = players[id].velY + y
	if (isAcceptableVel(newVelX) && isAcceptableVel(newVelY)) {
    players[id].velX = newVelX
    players[id].velY = newVelY
	}
}

// thanks SO
function stringToColour(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var colour = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return colour;
}

function gameLoop() {
	// move everyone around
  Object.keys(players).forEach((playerId) => {
    let player = players[playerId]
    movePlayer(playerId, player.velX, player.velY)
  })

  // tell everyone what's up
  io.emit('gameStateUpdate', players);
}

io.on('connection', function(socket){
  console.log('User connected: ', socket.id)

  // add player to players obj
  players[socket.id] = {
  	height: 0,
  	width: 0,
  	velX: 0,
  	velY: 0,
  	colour: stringToColour(socket.id)
  }

  // set socket listeners

  socket.on('disconnect', function() {
  	delete players[socket.id]
    io.emit('gameStateUpdate', players);
  })

  socket.on('up', function(msg){
    console.log('up message received from ', socket.id)
    // player goes up
    accelPlayer(socket.id, 0, -1)
  });

  socket.on('down', function() {
    console.log('down message received from ', socket.id)
  	// player goes down
    accelPlayer(socket.id, 0, 1)
  })

  socket.on('left', function(msg){
    console.log('left message received from ', socket.id)
    // player goes left
    accelPlayer(socket.id, -1, 0)
  });

  socket.on('right', function() {
    console.log('right message received from ', socket.id)
  	// player goes right
    accelPlayer(socket.id, 1, 0)
  })
});




http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
  // start the game
  setInterval(gameLoop, 30)
});
