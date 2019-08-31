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
import { init, Sprite, GameLoop, bindKeys, initKeys, keyPressed } from "kontra";
import playerSvg from "./images/player.svg";
import houseSvg from "./images/house.svg";

const imageFromSvg = svgString => {
  let image = new Image();
  const svgInBase64 = btoa(svgString);
  const base64Header = "data:image/svg+xml;base64,";
  image.src = base64Header + svgInBase64;
  return image;
};

const playerSpeed = 3;
const gravity = 2;
const jumpVelocity = -30;
const climbSpeed = 2;

const STATE_ON_GROUND = 0;
const STATE_JUMPING = 1;
const STATE_CLIMBING = 2;

const CAMERA_MODE_FOLLOW_PLAYER = 0;
const CAMERA_MODE_SHOW_WHOLE_LEVEL = 1;

let { canvas, context } = init();

initKeys();

let playerImage = imageFromSvg(playerSvg);
let houseImage = imageFromSvg(houseSvg);

let clouds0 = [];
let clouds1 = [];
let ladders = [];
let backgroundObjects = [];
let player;

let level = {
  left: 0,
  top: 0,
  width: 1200,
  height: 1500
};

let camera = {
  x: 0,
  y: 0,
  zoom: 1,
  mode: CAMERA_MODE_FOLLOW_PLAYER,

  zoomToLevel: function() {
    this.x = level.left + level.width / 2;
    this.y = level.top + level.height / 2;

    if (level.width / level.height >= canvas.width / canvas.height) {
      this.zoom = canvas.width / level.width;
    } else {
      this.zoom = canvas.height / level.height;
    }
  },

  followPlayer() {
    let newX, newY;

    newX = player.x + player.width;
    newY = player.y + player.height;

    const zoomedWidth = level.width * this.zoom;
    const zoomedHeight = level.height * this.zoom;

    // Zoom such that camera stays within the level.
    if (zoomedWidth < canvas.width || zoomedHeight < canvas.height) {
      this.zoom = Math.max(
        canvas.width / level.width,
        canvas.height / level.height
      );
    }

    const viewAreaWidth = canvas.width / this.zoom;
    const viewAreaHeight = canvas.height / this.zoom;

    // Keep camera within level in x-direction.
    if (newX - viewAreaWidth / 2 < level.left) {
      newX = level.left + viewAreaWidth / 2;
    } else if (newX + viewAreaWidth / 2 > level.width) {
      newX = level.width - viewAreaWidth / 2;
    }

    // Keep camera within level in y-direction.
    if (newY - viewAreaHeight / 2 < level.top) {
      newY = level.top + viewAreaHeight / 2;
    } else if (newY + viewAreaHeight / 2 > level.height) {
      newY = level.height - viewAreaHeight / 2;
    }

    this.x = newX;
    this.y = newY;
  },

  update: function() {
    if (this.mode === CAMERA_MODE_SHOW_WHOLE_LEVEL) {
      this.zoomToLevel();
    } else {
      this.followPlayer();
    }
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
    context.translate(canvas.width / 2, canvas.height / 2);
    context.scale(camera.zoom, camera.zoom);
    context.translate(-camera.x, -camera.y);

    for (let i = 0; i < clouds0.length; i++) {
      let cloud0 = clouds0[i];
      cloud0.render();
    }

    for (let i = 0; i < backgroundObjects.length; i++) {
      let object = backgroundObjects[i];
      object.render();
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

    // Draw level borders for debugging
    if (camera.mode === CAMERA_MODE_SHOW_WHOLE_LEVEL) {
      context.save();
      context.strokeStyle = "red";
      context.lineWidth = 5;
      context.beginPath();
      context.lineTo(0, 0);
      context.lineTo(level.width, 0);
      context.lineTo(level.width, level.height);
      context.lineTo(0, level.height);
      context.closePath();
      context.stroke();
      context.restore();
    }

    context.restore();
  }
});

const createCloud = (y, z) => {
  if (z === 0) {
    return Sprite({
      x: Math.random() * level.width * (5 / 4) - level.width / 4,
      y: y + (Math.random() * 200 - 102120),
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
      x: Math.random() * level.width * (5 / 4) - level.width / 4,
      y: y + (Math.random() * 200 - 100),
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
    width: 50,
    height: 150,
    vel: 0, // Vertical velocity, affected by jumping and gravity
    state: STATE_ON_GROUND,

    isOnGround: function() {
      const margin = 5;
      return this.y + this.height > level.height - margin;
    },

    render: function() {
      this.context.drawImage(playerImage, this.x, this.y);
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
    height: level.height,

    render: function() {
      const stepGap = 30;
      const stepCount = this.height / stepGap;
      let cx = this.context;
      cx.save();
      cx.fillStyle = this.color;

      for (let i = 0; i < stepCount; i++) {
        cx.fillRect(this.x, this.y + i * stepGap, this.width, 6);
      }

      cx.restore();
    }
  });
};

const createCloudLayer = y => {
  for (let i = 0; i < 20; i++) {
    let cloud0 = createCloud(y, 0);
    clouds0.push(cloud0);
  }

  for (let i = 0; i < 20; i++) {
    let cloud1 = createCloud(y, 1);
    clouds1.push(cloud1);
  }
};

const initScene = () => {
  clouds0 = [];
  clouds1 = [];
  createCloudLayer(200);
  createCloudLayer(650);

  backgroundObjects = [];

  let house = Sprite({
    width: 80,
    height: 150,

    render: function() {
      this.context.drawImage(houseImage, this.x, this.y);
    }
  });
  house.x = 400;
  house.y = level.height - house.height;
  backgroundObjects.push(house);

  ladders = [];
  let ladder = createLadder();
  ladder.x = level.width / 2;
  ladder.y = level.top;
  ladders.push(ladder);

  player = createPlayer();
  player.x = 30;
  player.y = level.height / 2 - player.height;
};

const resize = () => {
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 10;
};

window.addEventListener("resize", resize, false);
resize();

initScene();

// Keys for debugging
bindKeys(["1"], () => {
  camera.zoom = 1;
  camera.mode = CAMERA_MODE_FOLLOW_PLAYER;
});
bindKeys(["2"], () => {
  camera.mode = CAMERA_MODE_SHOW_WHOLE_LEVEL;
});

loop.start();
