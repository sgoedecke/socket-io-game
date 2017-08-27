# Socket.io Game Demo

This is me messing around with building a (very) simple multiplayer online game with socket.io. Current constraints:

* Only one "room"
* No real game: no collision, scoring, death, etc...
* Extremely simple physics & movement
* No real way to stop the game once everyone disconnects: once it's going, it's emitting state updates every 20ms _forever_

The current plan is to use this as a jumping-off point for actual games, which will implement some of the above properly.

Ideas:
* Use Matter.js to render the game client-side, and emit velocity & position updates for every player entity. This would give me client-side-guessing for free, which is pretty nice
* Ignore the physics stuff and build something like Snake, which doesn't require acceleration/etc.

Before this can be deployed ever, the "stop the game" issue will need to be solved. It'd also be nice to implement a max room size (multiple rooms & matchmaking can come much later)