var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var gameInterval
// ----------------------------------------
// Main server code
// ----------------------------------------

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

const players = {}

const gameSize = 50; // 50-tile grid of possible locations

function isValidSquare(newSquare) {
	// bounds check
	if (newSquare.x < 0 || newSquare.x > gameSize) {
		return false
	}
	if (newSquare.y < 0 || newSquare.y > gameSize) {
		return false
	}
	// collision check
	var hasCollided = false
	// console.log("new square", newSquare)
	Object.values(players).forEach((player) => {
		player.squares.forEach((square) => {
			if (square.x == newSquare.x && square.y == newSquare.y) {
				hasCollided = true
			}
		})
	})
	if (hasCollided) { return false }
	return true
}

function movePlayer(id) {

	var player = players[id]
	var lastSquare = player.squares[player.squares.length - 1]

	var newSquare = {
		x: lastSquare.x + player.accel.x,
		y: lastSquare.y + player.accel.y
	}
	if (isValidSquare(newSquare)) {
		// move the player and increment score
		player.squares.push(newSquare)
		if (player.squares.length % 30 == 0) { player.score++ }
	} else {
		// reset the player
		player.squares = [player.squares[player.squares.length - 1]]
		if (player.score >= 5) { player.score -= 5 }
	}
}

function accelPlayer(id, x, y) {
	players[id].accel.x = x
	players[id].accel.y = y
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
  	movePlayer(playerId)
  })

  // tell everyone what's up
  io.emit('gameStateUpdate', players);
}

io.on('connection', function(socket){
  console.log('User connected: ', socket.id)
  // start game if this is the first player
  if (Object.keys(players).length == 0) {
  	gameInterval = setInterval(gameLoop, 30)
	}
  // add player to players obj
  players[socket.id] = {
  	accel: {
  		x: 1,
  		y: 0
  	},
  	squares: [
  		{x: 0, y: 0}
  	],
  	colour: stringToColour(socket.id),
  	score: 0
  }

  // set socket listeners

  socket.on('disconnect', function() {
  	delete players[socket.id]
  	// end game if there are no players left
  	if (Object.keys(players).length > 0) {
    	io.emit('gameStateUpdate', players);
  	} else {
  		clearInterval(gameInterval)
  	}
  })

  socket.on('up', function(msg){
    accelPlayer(socket.id, 0, -1)
  });

  socket.on('down', function() {
    accelPlayer(socket.id, 0, 1)
  })

  socket.on('left', function(msg){
    accelPlayer(socket.id, -1, 0)
  });

  socket.on('right', function() {
    accelPlayer(socket.id, 1, 0)
  })
});

http.listen(process.env.PORT || 8080, function(){
  console.log('listening on *:8080', process.env.PORT);
});
