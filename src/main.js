/*
 * Copyright (c) 2019 Sami H, Tero Jäntti
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { init, Sprite, GameLoop, initKeys, keyPressed } from "kontra";

const playerSpeed = 3;
const gravity = 2;
const jumpVelocity = -30;
const climbSpeed = 2;

const STATE_ON_GROUND = 0;
const STATE_JUMPING = 1;
const STATE_CLIMBING = 2;

let { canvas, context } = init();

initKeys();

let clouds0 = [];
let clouds1 = [];
let ladders = [];
let player;

let level = {
  left: 0,
  top: 0,
  width: 1200,
  height: 1000
};

let camera = {
  x: 0,
  y: 0,

  update: function() {
    let newX, newY;

    newX = player.x;
    newY = player.y;

    if (newX - canvas.width / 2 < level.left) {
      newX = level.left + canvas.width / 2;
    }
    if (level.width < newX + canvas.width / 2) {
      newX = level.width - canvas.width / 2;
    }
    if (newY - canvas.height / 2 < level.top) {
      newY = level.top + canvas.height / 2;
    }
    if (level.height < newY + canvas.height / 2) {
      newY = level.height - canvas.height / 2;
    }

    this.x = newX;
    this.y = newY;
  }
};

let loop = GameLoop({
  update: () => {
    for (let i = 0; i < clouds0.length; i++) {
      clouds0[i].update();
      clouds1[i].update();
    }

    player.update();

    camera.update();
  },
  render: () => {
    context.fillStyle = "rgb(100,100,255)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.translate(
      canvas.width / 2 - camera.x,
      canvas.height / 2 - camera.y
    );

    for (let i = 0; i < clouds0.length; i++) {
      let cloud0 = clouds0[i];
      cloud0.render();
    }

    for (let i = 0; i < ladders.length; i++) {
      let ladder = ladders[i];
      ladder.render();
    }

    player.render();

    for (let i = 0; i < clouds1.length; i++) {
      let cloud1 = clouds1[i];
      cloud1.render();
    }

    context.restore();
  }
});

const createCloud = z => {
  if (z === 0) {
    return Sprite({
      x: Math.random() * level.width - level.width / 4,
      y: Math.random() * 200,
      color: "white",
      opacity: 0.95,
      dx: 0.07 + Math.random() * 0.1,
      radius: 20 + Math.random() * Math.random() * 70,

      update: function() {
        this.advance();
        if (this.x - 300 > level.width) {
          this.x = -600;
        }
      },

      render: function() {
        let cx = this.context;
        cx.save();
        cx.fillStyle = this.color;
        (cx.globalAlpha = this.opacity), cx.beginPath();
        cx.beginPath();
        let startX = this.x;
        let startY = this.y;
        cx.moveTo(startX, startY);
        cx.bezierCurveTo(
          startX - 40,
          startY + 20,
          startX - 40,
          startY + 70,
          startX + 60,
          startY + 70
        );
        if (this.radius < 45) {
          cx.bezierCurveTo(
            startX + 80,
            startY + 100,
            startX + 150,
            startY + 100,
            startX + 170,
            startY + 70
          );
        }
        cx.bezierCurveTo(
          startX + 250,
          startY + 70,
          startX + 250,
          startY + 40,
          startX + 220,
          startY + 20
        );
        cx.bezierCurveTo(
          startX + 260,
          startY - 40,
          startX + 200,
          startY - 50,
          startX + 170,
          startY - 40
        );
        cx.bezierCurveTo(
          startX + 150,
          startY - 75,
          startX + 80,
          startY - 60,
          startX + 80,
          startY - 40
        );
        cx.bezierCurveTo(
          startX + 30,
          startY - 75,
          startX - 20,
          startY - 60,
          startX,
          startY
        );
        cx.closePath();
        cx.fill();
        cx.restore();
      }
    });
  } else {
    return Sprite({
      x: Math.random() * level.width - level.width / 4,
      y: Math.random() * 200,
      color: "white",
      opacity: 0.7,
      dx: 0.05 + Math.random() * 0.1,
      radius: 20 + Math.random() * Math.random() * 70,

      update: function() {
        this.advance();
        if (this.x - 300 > level.width) {
          this.x = -600;
        }
      },

      render: function() {
        let cx = this.context;
        cx.save();
        cx.fillStyle = this.color;
        (cx.globalAlpha = this.opacity), cx.beginPath();
        cx.beginPath();
        let startX = this.x;
        let startY = this.y;
        cx.moveTo(startX, startY);
        cx.bezierCurveTo(
          startX - 40,
          startY + 20,
          startX - 40,
          startY + 70,
          startX + 60,
          startY + 70
        );
        if (this.radius < 45) {
          cx.bezierCurveTo(
            startX + 80,
            startY + 100,
            startX + 150,
            startY + 100,
            startX + 170,
            startY + 70
          );
        }
        cx.bezierCurveTo(
          startX + 250,
          startY + 70,
          startX + 250,
          startY + 40,
          startX + 220,
          startY + 20
        );
        cx.bezierCurveTo(
          startX + 260,
          startY - 40,
          startX + 200,
          startY - 50,
          startX + 170,
          startY - 40
        );
        cx.bezierCurveTo(
          startX + 150,
          startY - 75,
          startX + 80,
          startY - 60,
          startX + 80,
          startY - 40
        );
        cx.bezierCurveTo(
          startX + 30,
          startY - 75,
          startX - 20,
          startY - 60,
          startX,
          startY
        );
        cx.closePath();
        cx.fill();
        cx.restore();
      }
    });
  }
};

const createPlayer = () => {
  return Sprite({
    color: "red",
    width: 40,
    height: 60,
    vel: 0, // Vertical velocity, affected by jumping and gravity
    state: STATE_ON_GROUND,

    isOnGround: function() {
      const margin = 5;
      return this.y + this.height > level.height - margin;
    },

    update: function() {
      let dx = 0;
      let dy = 0;

      if (keyPressed("left") && this.x > 0) {
        dx = -playerSpeed;
      } else if (keyPressed("right") && this.x < level.width - this.width) {
        dx = playerSpeed;
      }

      let canClimb = false;
      for (let i = 0; i < ladders.length; i++) {
        let ladder = ladders[i];
        if (ladder.collidesWith(player)) {
          canClimb = true;
        }
      }

      if (!canClimb && this.state === STATE_CLIMBING) {
        this.state = STATE_ON_GROUND;
      }

      if (keyPressed("up")) {
        if (canClimb) {
          this.state = STATE_CLIMBING;
          this.vel = 0;
          dy -= climbSpeed;
        } else if (this.state !== STATE_JUMPING && this.isOnGround()) {
          this.vel = jumpVelocity;
          this.state = STATE_JUMPING;
        }
      } else if (keyPressed("down") && canClimb) {
        this.state = STATE_CLIMBING;
        this.vel = 0;
        dy += climbSpeed;
      }

      if (this.state !== STATE_CLIMBING) {
        this.vel += gravity;
        dy += this.vel;
      }

      this.x += dx;

      if (this.y + dy > level.height - this.height) {
        this.y = level.height - this.height;
        this.vel = 0;
        this.state = STATE_ON_GROUND;
      } else {
        this.y += dy;
      }
    }
  });
};

const createLadder = () => {
  return Sprite({
    color: "gray",
    width: 30,
    height: level.height
  });
};

const initScene = () => {
  clouds0 = [];
  for (let i = 0; i < 20; i++) {
    let cloud0 = createCloud(0);
    clouds0.push(cloud0);
  }

  ladders = [];
  let ladder = createLadder();
  ladder.x = level.width / 2;
  ladder.y = level.top;
  ladders.push(ladder);

  player = createPlayer();
  player.x = 30;
  player.y = level.height / 2 - player.height;

  clouds1 = [];
  for (let i = 0; i < 20; i++) {
    let cloud1 = createCloud(1);
    clouds1.push(cloud1);
  }
};

const resize = () => {
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 10;
};

window.addEventListener("resize", resize, false);
resize();

initScene();
loop.start();
