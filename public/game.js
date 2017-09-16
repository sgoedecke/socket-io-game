var players = {}

const gameSize = 500; // 50-tile grid of possible locations

const playerSize = 50; // players are 50/50 squares

function isValidPosition(newPosition, playerId) {
  // bounds check
  if (newPosition.x < 0 || newPosition.x + playerSize > gameSize) {
    return false
  }
  if (newPosition.y < 0 || newPosition.y + playerSize > gameSize) {
    return false
  }
  // collision check
  var hasCollided = false


  Object.keys(players).forEach((key) => {
    if (key == playerId) { return } // ignore current player in collision check
    player = players[key]
    // if the players overlap. hope this works
    if (Math.abs(player.x - newPosition.x) < playerSize && Math.abs(player.y - newPosition.y) < playerSize) {
      hasCollided = true
      return // don't bother checking other stuff
    }
  })
  if (hasCollided) { return false }
  return true
}

function movePlayer(id) {

  var player = players[id]

  var newPosition = {
    x: player.x + player.accel.x,
    y: player.y + player.accel.y
  }
  if (isValidPosition(newPosition, id)) {
    // move the player and increment score
    player.x = newPosition.x
    player.y = newPosition.y
  } else {
    // don't move the player
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

if (!this.navigator) { // super hacky thing to determine whether this is a node module or inlined via script tag
  module.exports = {
    players: players,
    stringToColour: stringToColour,
    accelPlayer: accelPlayer,
    movePlayer: movePlayer,
    playerSize: playerSize
  }
}
