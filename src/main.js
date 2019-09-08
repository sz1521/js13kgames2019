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
import { init, Sprite, GameLoop, bindKeys, keyPressed, initKeys } from "kontra";
import { createCamera } from "./camera.js";
import { createPlayer } from "./player.js";
import { createEnemy } from "./enemy.js";
import { imageFromSvg } from "./utils.js";
import houseSvg from "./images/house.svg";
import { initialize, playTune } from "./music.js";
const houseImage = imageFromSvg(houseSvg);

let { canvas, context } = init();

initKeys();

const FRAMES_PER_SECOND = 60;
const SECONDS_PER_FRAME = 1 / FRAMES_PER_SECOND;
const TIME_BACK_MAX_SECONDS = 3;

const ANTI_GRAVITY_WARN_TIME = 0.5;
const ANTI_GRAVITY_DRAIN_TIME = 1.5;

let clouds0 = [];
let clouds1 = [];
let city = [];
let ladders = [];
let platforms = [];
let backgroundObjects = [];
let enemies = [];
let player;

let level = {
  left: 0,
  top: 0,
  width: 4000,
  height: 4000
};

let camera = createCamera(level, canvas);

const timeTravelUpdate = (entity, back) => {
  if (!entity.positions) {
    entity.positions = [];
  }

  if (back) {
    if (entity.positions.length > 0) {
      let position = entity.positions.pop();
      entity.position = position;
    }
  } else {
    const maxLength = TIME_BACK_MAX_SECONDS * FRAMES_PER_SECOND;
    entity.positions.push(entity.position);
    if (entity.positions.length > maxLength) {
      entity.positions.shift();
    }

    entity.update();
  }
};

let backTime = 0;
let agOffStartTime = null;

const updateAntiGravityState = back => {
  let now = performance.now();

  if (back) {
    backTime += SECONDS_PER_FRAME;

    if (backTime > ANTI_GRAVITY_DRAIN_TIME) {
      player.ag = 0;
      agOffStartTime = now;
    } else if (backTime > ANTI_GRAVITY_WARN_TIME) {
      player.ag = 1;
    }
  } else {
    backTime = Math.max(0, backTime - SECONDS_PER_FRAME);

    if (agOffStartTime && now - agOffStartTime > 2000) {
      player.ag = 2;
      agOffStartTime = null;
    } else if (player.ag === 1 && backTime <= ANTI_GRAVITY_WARN_TIME) {
      player.ag = 2;
    }
  }
};

let loop = GameLoop({
  update() {
    const back = keyPressed("space");

    updateAntiGravityState(back);

    for (let i = 0; i < clouds0.length; i++) {
      timeTravelUpdate(clouds0[i], back);
      timeTravelUpdate(clouds1[i], back);
    }

    let hittingEnemy;
    for (let i = 0; i < enemies.length; i++) {
      let enemy = enemies[i];

      timeTravelUpdate(enemy, back);

      if (enemy.collidesWith(player)) {
        hittingEnemy = enemy;
        playTune("end");
      }
    }

    if (!back) {
      // The player stays put when moving back in time.
      player.update(ladders, platforms, hittingEnemy, camera);
    }

    camera.update();
  },

  render() {
    var gradient = context.createLinearGradient(0, 0, 0, 170);
    gradient.addColorStop(0, "rgb(100,100,155");
    gradient.addColorStop(1, "rgb(100,100,255)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.scale(camera.zoom, camera.zoom);
    context.translate(-camera.x, -camera.y);

    renderWorldObjects();

    context.restore();

    renderUi();
  }
});

const renderWorldObjects = () => {
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

  for (let i = 0; i < platforms.length; i++) {
    platforms[i].render();
  }

  for (let i = 0; i < enemies.length; i++) {
    enemies[i].render();
  }

  player.render();

  for (let i = 0; i < clouds1.length; i++) {
    let cloud1 = clouds1[i];
    cloud1.render();
  }

  // Draw level borders for debugging
  if (!camera.target) {
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
};

const renderUi = () => {
  if (player.ag > 0) {
    context.fillStyle = player.ag === 2 ? "white" : "red";
    context.font = "22px Sans-serif";

    context.fillText("ANTI-GRAVITY", 50, 100);
  }
};

const createCloud = (y, z) => {
  return Sprite({
    x: Math.random() * level.width * (5 / 4) - level.width / 4,
    y:
      z === 0
        ? y + (Math.random() * 200 - 102120)
        : y + (Math.random() * 200 - 100),
    color: "white",
    opacity: z === 0 ? 0.95 : 0.7,
    dx: z === 0 ? 0.07 + Math.random() * 0.1 : 0.05 + Math.random() * 0.1,
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

const createPlatform = () => {
  return Sprite({
    color: "rgb(100, 100, 100)",
    width: 200,
    height: 30
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

const createHouseLayer = () => {
  for (let i = 0; i < canvas.width / 10; i++) {
    let house = Sprite({
      width: 80,
      height: 150 - Math.random() * 100,

      render: function() {
        this.context.drawImage(houseImage, this.x, this.y);
      }
    });
    house.x = i * Math.random() * 100;
    house.y = level.height - house.height;
    city.push(house);
    backgroundObjects.push(house);
  }
};

const createTower = (x, floorCount) => {
  for (let i = 0; i < floorCount; i++) {
    const floorWidth = 800;
    const floorHeight = 300;
    const floorTop = level.height - (i + 1) * floorHeight;
    const floorLeft = x - floorWidth / 2;

    let platform = createPlatform();
    platform.width = floorWidth;
    platform.x = floorLeft;
    platform.y = floorTop;
    platforms.push(platform);

    let enemy = createEnemy(platform);
    enemy.x = floorLeft + Math.random() * (floorWidth - enemy.width);
    enemy.y = floorTop - enemy.height;
    enemies.push(enemy);

    const ladderCount = Math.floor(Math.random() * 3 + 1);

    for (let j = 0; j < ladderCount; j++) {
      let ladder = createLadder();
      ladder.height = floorHeight;
      ladder.x = floorLeft + Math.random() * (floorWidth - ladder.width);
      ladder.y = floorTop;
      ladders.push(ladder);
    }
  }
};

const initScene = () => {
  ladders = [];
  platforms = [];
  clouds0 = [];
  clouds1 = [];
  backgroundObjects = [];

  createCloudLayer(200);
  createCloudLayer(800);

  createHouseLayer();
  createTower(1400, 7);
  createTower(2500, 10);

  player = createPlayer(level);
  player.x = 900;
  player.y = level.height - player.height;

  camera.follow(player);
};

const startGame = () => {
  if (loop.isStopped) {
    playTune("main");
    loop.start();
  }
};

const resize = () => {
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 10;
};

window.addEventListener("resize", resize, false);
resize();

initialize();

initScene();

// Keys for debugging
bindKeys(["1"], () => {
  camera.follow(player);
});
bindKeys(["2"], () => {
  camera.zoomToLevel();
});
bindKeys(["s"], () => {
  camera.shake(10, 1);
});

// Actual keys
bindKeys(["enter"], () => {
  startGame();
});

bindKeys(["a"], () => {
  player.ag = player.ag === 2 ? 0 : 2;
});

context.fillStyle = "red";
context.font = "22px Sans-serif";
context.fillText(
  "Press enter to start",
  canvas.width / 2 - 100,
  canvas.height / 2
);
