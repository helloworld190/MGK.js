# MGK.js

MGK.js is a small JavaScript tool to make simple 2D games.

---

## What it does(very useful trust)

- Lets you create game objects with parts (called components) like position, shapes, and movement.
- Supports circles and sprites for drawing.
- Has simple physics with speed and gravity.
- Detects when objects bump into each other and pushes them apart.
- Lets you add buttons and labels on the screen.
- Works in the browser with a canvas.

---

## How to install(very useful trust me)

Use npm:


npm install mgk.js


## How to use

import { Game, GameObject, Transform, Circle, RigidBody, Collider, CollisionSystem } from 'mgk.js';

const game = new Game({ width: 800, height: 600 });
game.lastTime = performance.now(); // Initialize lastTime properly

// Make a blue ball
const ball = new GameObject(game);
ball.addComponent(new Transform({ x: 100, y: 100 }));
ball.addComponent(new Circle({ radius: 20, fill: 'blue' }));
ball.addComponent(new RigidBody());
ball.addComponent(new Collider({ radius: 20 }));

game.objects.push(ball);
game.plugins.push(new CollisionSystem());

function loop(time = 0) {
  const dt = (time - game.lastTime) / 1000;
  game.lastTime = time;

  game.update(dt);
  game.render(); // Use the built-in render method for full rendering

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);


## Main parts
Game: The main game engine.

GameObject: Things you add to the game (like players or enemies).

Component: Pieces that give behavior to objects (position, drawing, physics).

Plugin: Extra stuff that can run each frame (like collision).

## Quick tips
Add components to game objects to give them behavior.

Use update(dt) every frame to update logic.

Use render(ctx) every frame to draw.

Use the CollisionSystem plugin to handle simple collisions automatically.

Real License
MIT © helloworld190

Help
Ask questions or report bugs on GitHub.
