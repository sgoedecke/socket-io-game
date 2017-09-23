# Building multiplayer games with socket.io and HTML5 Canvas

I've been building crappy hobby games on and off for my whole coding life. One of my very first apps was a Visual Basic game - I was in primary school, around grade 3 or 4 - where you had to click on a picture of a schoolteacher as she moved around the screen. As I was teaching myself to code properly, I built a few [half-finished](https://github.com/sgoedecke/hulk) [roguelikes](https://github.com/sgoedecke/questcod) in Python. Most recently, in some of the downtime of my dev job, I built a [tetris-like game](https://github.com/seangoedecke/zd-tetris) and an [asteroids clone](https://github.com/seangoedecke/zd-asteroids) with javascript and Matter.js. So after a couple of weekends playing around with socket.io, when I'd finished the tutorial and built a janky little [app](https://github.com/sgoedecke/ai-box) with what I'd learned, it was a natural step to try and build a game with it. Should be easy, right?

Before I started, I made a deliberate choice not to read up on writing netcode for online games. I suspected (rightly, as it turned out) that there were some rakes in the grass here that I ought to encounter as a learning experience. I had a few rough ideas about how an online game might work, and some examples: agar.io, slither.io, and TagPro. I knew how to get socket.io to pass messages really quickly between a Node.js server and a clientside script. Enough to get going with!

## Step One: boxes in space

My first question: what was the simplest MVP I could build in the "websocket-based online game" space? Forget realistic physics with Matter.js, forget player death, scoring, and anything else game-like. I started with a simpler goal. I wanted to have a little colourful box on a screen that each client could move around with arrow keys. [Here's as far as I got](https://github.com/sgoedecke/socket-io-game/commit/13bba58167df25d547fd057b1a1c39cdbbb903f0). Here's a rough outline about how this app functioned.

(1) There's a Node.js server and a bunch of clients that talk to it via socket.io

(2) When a client connects, it registers a player on the server with a unique ID (same as the socket's unique ID)

(3) All of the game logic and game state lives on the server, which ticks every 3
0ms. Each tick does two things: first, move all the players around based on their current velocity; second, emit the full game state to each client as a big js object of players and coordinates

(4) The server listens to 'up' 'down' 'left' and 'right' events, which are emitted by each client

(5) The client does only two things: listen for key events on the page so they can be emitted to the server, and
listen for game state messages from the server so it can re-draw the canvas with the players' new positions

I was pretty optimistic about my progress thus far. The app worked! When I had my local server running, I could open a bunch of different tabs and move all the little boxes around. My only reservations - besides the fact that there was no _game_ there yet - were the lack of any max room size/matchmaking logic server-side, and the fact that the server didn't stop ticking when all the players disconnected. I decided I'd fix these issues on the way to turning my MVP into an actual game.

## Step Two: scary snakes

As far as I was concerned, I'd validated my initial assumptions about how easy it would be to build a simple game with Node.js and websockets. Just pop a game engine up on the server, get the clients to emit events and listen for game state updates, and draw the game state locally with HTML5 Canvas. Just as easy as building a single-player game, except that one chunk of the code had to live on a server. I had not yet tried running any of this code in production.

My "actual game" idea was multiplayer Snake: each client would control a snake that could move in four directions at a constant speed. Running into your own tail or another snake would reset your length to zero, and eating a colourful dot would increase your length by one. Sounds fun, right? It would be kind of like slither.io, except more true to the simpler, four-direction classic snake game.

So I got coding. Instead of a coordinate pair, I gave each player in my global players object an array of coordinate pairs: the squares in a snake body. Moving the snakes simply involved adding one square in the right direction and removing the oldest square. I implemented player collision by checking if the square I was about to place had the same coordinates of any other square in the game. As an intermediate step, I left out the snake food and simply increased the length of each snake by one every hundred or so ticks. And after fixing a few annoying bugs, it worked!

Finally I had something I could show to other people. I'd just pop it on Heroku, link it to my friends and Hacker News, and bask in the admiration. Right? Of course not. After cleaning up the inevitable deployment hiccups - Object.values wasn't supported in Heroku's default node version, and I'd hardcoded the express port rather than relying on the env var Heroku sets - I was horrified by how laggy my game was. What had been a smooth framerate running locally was unplayably choppy in production. What was wrong?

I tried speeding up the server tick rate to 15ms or 20ms. I tried slowing it down to 80ms. Apart from making the gameplay uncomfortably fast or uncomfortably slow, this didn't affect the lag at all. The websocket messages were just not flowing smoothly enough from the server to the client. While the server was ticking away at 30ms, the gaps between the game update messages oscillated between 5ms and 1000ms. I had just learned a very important lesson about making online games: for acceptable performance, you must run the game on the client-side as well as the server-side.

## Step Three: client-side snakes

At least this problem had an easy fix. I extracted my game code into a module and served it on the client-side as well as on my Node.js server. (Okay, I just copy-pasted the game code into my client.js. But I did end up extracting it later.) I ran both instances of the game at the same tickrate, and made my client replace its own global game state object with the server's whenever the server emitted a game state update. This was more or less a success. When I deployed the code and fired up a client, my snake moved a lot more smoothly. There was the occasional jitter at the head of the snake as my client synced up with the server, but at least it felt like I was playing an actual game.

However, as soon as I started inputting commands, the problems began to appear. If I made a couple of quick turns, my whole snake would sometimes jerk sideways by a block or two - my server-side code had turned me a couple of ticks later than my client-side code did. And sometimes my snake would appear to dodge an obstacle before snapping back to hit the obstacle and lose all its length, as the server decided that I had not dodged in time after all. I linked the game to my brother. "Why is it so laggy?" he asked. Why, indeed.

I made an abortive stab at a hail-mary solution: as well as syncing up the client-side state with the server state on update, I would also emit updates to the server and have it sync up with the client. This two-way syncing was of course a total disaster. While the game was marginally less laggy as a single player, having two or more snakes led to even more snapping and teleportation as each client pulled the server apart between them. Unplayable. [Here's](https://github.com/sgoedecke/socket-io-game/tree/laggy-snake-game
) the final version of my snake game, before I abandoned it.

## Step Four: if you can't win, cheat

At this point I was feeling like I'd stepped on enough rakes and it was about time to go to the experts. I read a couple of articles about calculating velocity deltas, interpolating frames, and other very clever ways of predicting the next game state. As I read, it began to seem a lot less like a fun hobby project and a lot more like work. As a last try, I played a few games of slither.io and TagPro in order to have a peek at their code and network communications. And I noticed something interesting. Those games had a similar physics-y feel to them, as if you were moving a heavy object on ice. Top speed was reasonably fast - especially in TagPro - but acceleration was slow. Very different from my snake game, where you could change your direction ninety degrees with a single keypress.

For the first time, I began to suspect that this might be strategic. In a fast-acceleration game, a few hundred ms gap between the server and the client will cause your character to teleport large distances around the screen. But in a slow-acceleration game, the same hundred ms gap might cause your character to teleport a couple of pixels. The few seconds it takes to convince your character to change direction gives the server and client lots of time to agree on where your character should be.

I decided to return to my original idea: single blocks moving around the screen. This time, I copied the slow-acceleration style of successful online games. And at long last, I had something that was playable! If you were watching closely, you would still notice that changing direction was a bit slower than it should be. But the teleportation was totally gone.

I mitigated the slight lag by copying another trick from slither.io. That game has slow acceleration, but your snake's eyes will immediately rotate to point the direction you're going as soon as you hit a key. This trick of giving the player instant feedback - even if the actual character movement is delayed - makes a surprising psychological difference. By painting a black bar at the direction of the most recent keypress, I made my game feel much less laggy.

## Wrap-up

So where's my game at now? It still looks ugly, but it's a functional vaguely-pirate themed game where you sail around collecting doubloons before everyone else can. Here's the [repo](https://github.com/sgoedecke/socket-io-game) and here's the [game](https://socket-blocker.herokuapp.com/). The biggest remaining problem is the framerate, which is painfully low. The next step is probably some kind of interpolation on the client-side to smooth the game out. What did I learn?

(1) Extract your game code into a module. Run it client-side and server-side at the same time and the same tickrate

(2) Make your server-side game state the single source of truth that your clients all update to. Broadcast game state updates every tick

(3) Pick your game mechanics carefully to accommodate laggy updates. Slow acceleration is your friend

(4) Give the player some kind of immediate client-side feedback when they press a key

Check out the interesting HN discussion of this article [here](https://news.ycombinator.com/item?id=15318530).
