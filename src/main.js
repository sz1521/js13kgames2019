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
import { createPlayer, MAX_ENERGY } from "./player.js";
import { createEnemy } from "./enemy.js";
import { createDrone } from "./drone.js";
import { createPortal } from "./portal.js";
import { imageFromSvg, random } from "./utils.js";
import houseSvg from "./images/house.svg";
import { initialize, playTune } from "./music.js";
const houseImage = imageFromSvg(houseSvg);

let { canvas, context } = init();

initKeys();

const GAME_STATE_START_SCREEN = 0;
const GAME_STATE_RUNNING = 1;

const FRAMES_PER_SECOND = 60;
const TIME_BACK_MAX_SECONDS = 2;
const TIME_BACK_MAX_FRAMES = TIME_BACK_MAX_SECONDS * FRAMES_PER_SECOND;

const TIME_BACK_ENERGY_CONSUMPTION = 35;
const ENERGY_THRESHOLD_LOW = 4000;
const ENERGY_THRESHOLD_VERY_LOW = 2000;

let state = GAME_STATE_START_SCREEN;

let clouds0 = [];
let clouds1 = [];
let ladders = [];
let platforms = [];
let backgroundObjects = [];
let enemies = [];
let player;
let portal;

let gameFinished = false;

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
    entity.positions.push(entity.position);
    if (entity.positions.length > TIME_BACK_MAX_FRAMES) {
      entity.positions.shift();
    }

    entity.update();
  }
};

const consumeTimeTravelEnergy = () => {
  if (
    player.energy >= TIME_BACK_ENERGY_CONSUMPTION &&
    player.timeTravelFrames < TIME_BACK_MAX_FRAMES
  ) {
    player.energy -= TIME_BACK_ENERGY_CONSUMPTION;
    player.timeTravelFrames += 1;
    return true;
  }
};

const hitPlayer = enemy => {
  playTune("hit");
  const enemyCenter = enemy.x + enemy.width / 2;
  const playerCenter = player.x + player.width / 2;
  const direction = Math.sign(playerCenter - enemyCenter);
  player.hit(direction * 20);
};

const updateEntities = timeTravelPressed => {
  for (let i = 0; i < clouds0.length; i++) {
    timeTravelUpdate(clouds0[i], timeTravelPressed);
    timeTravelUpdate(clouds1[i], timeTravelPressed);
  }

  for (let i = 0; i < enemies.length; i++) {
    let enemy = enemies[i];

    timeTravelUpdate(enemy, timeTravelPressed);

    if (enemy.collidesWith(player)) {
      hitPlayer(enemy);
    }
  }

  if (!timeTravelPressed) {
    // The player stays put when moving back in time.
    player.update(ladders, platforms, camera);
  }

  if (portal.collidesWith(player)) {
    player.swirl();
    gameFinished = true;
  }
};

const createGameLoop = () => {
  return GameLoop({
    update() {
      let timeTravelPressed = keyPressed("space");
      let canTimeTravel = false;

      if (timeTravelPressed) {
        canTimeTravel = consumeTimeTravelEnergy();
      } else {
        if (player.timeTravelFrames > 0) {
          player.timeTravelFrames -= 1;
        }
      }

      // Don't update when reaching time travel limit.
      if (!timeTravelPressed || canTimeTravel) {
        updateEntities(timeTravelPressed);
      }

      camera.update();
    },

    render() {
      var gradient = context.createLinearGradient(0, 0, 0, 170);
      gradient.addColorStop(0, "rgba(0,0,0,0.5)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      context.scale(camera.zoom, camera.zoom);
      context.translate(-camera.x, -camera.y);

      var gradient2 = context.createLinearGradient(0, 0, 0, level.height);
      gradient2.addColorStop(0, "rgb(0,0,25");
      gradient2.addColorStop(0.2, "rgb(255,0,0)");
      gradient2.addColorStop(0.4, "rgb(255,200,0)");
      gradient2.addColorStop(1, "rgb(100,100,255)");
      context.fillStyle = gradient2;
      context.fillRect(0, 0, level.width, level.height);

      renderWorldObjects();

      context.restore();

      renderUi();
    }
  });
};

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

  portal.render();

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

const renderEnergyBar = () => {
  context.fillStyle = "white";
  context.font = "20px Sans-serif";

  context.fillText("ENERGY", 50, 35);

  const x = 50,
    y = 50,
    margin = 5,
    outlineWidth = canvas.width / 2,
    outlineHeight = 50,
    fullWidth = outlineWidth - 2 * margin,
    heigth = outlineHeight - 2 * margin,
    width = (player.energy / MAX_ENERGY) * fullWidth;

  context.strokeStyle = "red";
  context.strokeRect(x, y, outlineWidth, outlineHeight);

  let color = "green";
  if (player.energy < ENERGY_THRESHOLD_VERY_LOW) {
    color = "red";
  } else if (player.energy < ENERGY_THRESHOLD_LOW) {
    color = "orange";
  }

  context.fillStyle = color;
  context.fillRect(x + margin, y + margin, width, heigth);
};

const renderUi = () => {
  if (player.isDead()) {
    renderInfoText("Press enter");
  }

  renderEnergyBar();

  if (player.ag) {
    context.fillStyle = "white";
    context.font = "22px Sans-serif";

    context.fillText("ANTI-GRAVITY", 50, 150);
  }

  if (gameFinished) {
    renderTexts("CONGRATULATIONS!", "YOU REACHED THE PORTAL!");
  }
};

const createCloud = (y, z, opacity) => {
  return Sprite({
    x: Math.random() * level.width * (5 / 4) - level.width / 4,
    y:
      z === 0
        ? y + (Math.random() * 200 - 102120)
        : y + (Math.random() * 200 - 100),
    color: "white",
    opacity: z === 0 ? 0.95 * opacity : 0.7 * opacity,
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
      cx.globalAlpha = this.opacity;
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
    color: "rgb(100,100,100)",
    color2: "rgb(80,80,120)",
    width: 30,
    height: level.height,
    stepGap: random(40),

    render: function() {
      const stepCount = this.height / this.stepGap;
      let cx = this.context;
      cx.save();

      for (let i = 0; i < stepCount; i++) {
        cx.fillStyle = this.color2;
        cx.fillRect(
          this.x + 8,
          this.y + i * this.stepGap,
          this.width - 16,
          this.stepGap / 2
        );
        cx.fillStyle = this.color;
        cx.fillRect(
          this.x,
          this.y + i * this.stepGap + this.stepGap / 2,
          this.width,
          this.stepGap / 2
        );
      }

      cx.restore();
    }
  });
};

const createPlatform = () => {
  return Sprite({
    color: "darkgray",
    color2: "gray",
    width: 200,
    height: 20,

    render: function() {
      const stepGap = 20;
      const stepCount = this.height / stepGap;
      let cx = this.context;
      cx.save();

      for (let i = 0; i < stepCount; i++) {
        cx.fillStyle = this.color2;
        cx.fillRect(this.x + 2, this.y + i * stepGap, this.width - 4, 10);
        cx.fillStyle = this.color;
        cx.fillRect(this.x, this.y + i * stepGap + 15, this.width, 10);
      }

      cx.restore();
    }
  });
};

const createCloudLayer = (y, opacity) => {
  for (let i = 0; i < 20; i++) {
    let cloud0 = createCloud(y, 0, opacity);
    clouds0.push(cloud0);
  }

  for (let i = 0; i < 20; i++) {
    let cloud1 = createCloud(y, 1, opacity);
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
    backgroundObjects.push(house);
  }
};

const createTower = (x, floorCount) => {
  const floorWidth = 800;
  const floorHeight = 300;

  for (let i = 0; i < floorCount; i++) {
    const floorTop = level.height - (i + 1) * floorHeight;
    const floorLeft = x - floorWidth / 2;

    let platform = createPlatform();
    platform.width = floorWidth;
    platform.x = floorLeft;
    platform.y = floorTop;
    platforms.push(platform);

    let enemy = createEnemy(platform);
    enemy.x = floorLeft + random(floorWidth - enemy.width);
    enemy.y = floorTop - enemy.height;
    enemies.push(enemy);

    const ladderCount = Math.floor(random(3) + 1);

    for (let j = 0; j < ladderCount; j++) {
      let ladder = createLadder();
      ladder.height = floorHeight;
      ladder.x = floorLeft + random(floorWidth - ladder.width);
      ladder.y = floorTop;
      ladders.push(ladder);
    }
  }

  return {
    x,
    width: floorWidth,
    height: floorCount * floorHeight,
    top: level.height - floorCount * floorHeight,
    bottom: level.height,
    left: x - floorWidth / 2,
    right: x + floorWidth / 2
  };
};

const initScene = () => {
  ladders = [];
  platforms = [];
  clouds0 = [];
  clouds1 = [];
  backgroundObjects = [];
  enemies = [];

  createCloudLayer(2000, 1);
  createCloudLayer(800, 0.5);

  createHouseLayer();

  const tower1 = createTower(1400, 7);
  const tower2 = createTower(2500, 10);

  portal = createPortal();
  portal.x = tower2.x;
  portal.y = tower2.top - portal.height;

  player = createPlayer(level);
  player.x = 900;
  player.y = level.height - player.height;

  const wayPoints = [
    { x: tower1.left - 200, y: tower1.top + 300 },
    { x: tower1.left - 200, y: tower1.bottom - tower1.height / 2 },
    { x: tower1.x, y: tower1.top - 300 },
    { x: tower1.right + 200, y: tower1.bottom - tower1.height / 2 },

    { x: tower2.left - 200, y: tower2.top + 300 },
    { x: tower2.left - 200, y: tower2.bottom - tower2.height / 2 },
    { x: tower2.x, y: tower2.top - 300 },
    { x: tower2.right + 200, y: tower2.bottom - tower2.height / 2 }
  ];

  for (let i = 0; i < 10; i++) {
    let drone = createDrone(player, wayPoints);
    drone.x = random(level.width);
    drone.y = random(level.height - 500);
    enemies.push(drone);
  }

  camera.follow(player);
};

const renderInfoText = text => {
  renderTexts(text);
};

const renderTexts = (...texts) => {
  context.fillStyle = "white";
  context.font = "22px Sans-serif";

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    let textWidth = text.length * 14;
    const x = canvas.width / 2 - textWidth / 2;
    let y = canvas.height * 0.25 + i * 40;
    context.fillText(text, x, y);
  }
};

const listenKeys = () => {
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
  bindKeys(["a"], () => {
    player.ag = !player.ag;
  });
};

let gameLoop = createGameLoop();

const startGame = () => {
  if (state === GAME_STATE_START_SCREEN || player.isDead()) {
    gameLoop.stop();

    gameFinished = false;
    initScene();
    listenKeys();
    playTune("main");

    state = GAME_STATE_RUNNING;

    gameLoop = createGameLoop();
    gameLoop.start();
  }
};

const resize = () => {
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 10;
};

const renderStartScreen = lastText => {
  renderTexts(
    "Controls:",
    "A - Anti-gravity",
    "SPACE - Time travel",
    "",
    "",
    lastText
  );
};

window.addEventListener("resize", resize, false);
resize();

renderStartScreen("Loading...");

initialize().then(() => {
  bindKeys(["enter"], () => {
    startGame();
  });

  context.clearRect(0, 0, canvas.width, canvas.height);
  renderStartScreen("Press enter to start");
});
