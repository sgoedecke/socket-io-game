var players = {}

const gameSize = 250; // 50-tile grid of possible locations

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
  Object.keys(players).forEach((key) => {
    player = players[key] 
  // })
  // .forEach((player) => {
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

if (!this.navigator) {
  module.exports = {
    players: players,
    stringToColour: stringToColour,
    accelPlayer: accelPlayer,
    movePlayer: movePlayer
  }
}
