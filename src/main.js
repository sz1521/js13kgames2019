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

let { canvas, context } = init();

initKeys();

let clouds = [];

let player;

let loop = GameLoop({
  update: () => {
    for (let i = 0; i < clouds.length; i++) {
      clouds[i].update();
    }

    if (keyPressed("left") && player.x > 0) {
      player.x -= playerSpeed;
    } else if (keyPressed("right") && player.x < canvas.width - player.width) {
      player.x += playerSpeed;
    }
  },
  render: () => {
    context.fillStyle = "rgb(100,100,255)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < clouds.length; i++) {
      let cloud = clouds[i];
      cloud.render();
    }

    player.render();
  }
});

const createCloud = () => {
  return Sprite({
    x: Math.random() * canvas.width,
    y: Math.random() * 200,
    color: "white",
    opacity: 0.95,
    dx: 0.05 + Math.random() * 0.1,
    radius: 20 + Math.random() * Math.random() * 70,

    update: function() {
      this.advance();
      if (this.x - 300 > canvas.width) {
        this.x = -300;
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

const initScene = () => {
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 10;

  player = Sprite({
    x: 100,
    y: 80,
    color: "red",
    width: canvas.height / 20,
    height: canvas.height / 10
  });
  player.x = 0;
  player.y = canvas.height - player.height;

  clouds = [];
  for (let i = 0; i < 25; i++) {
    let cloud = createCloud();
    clouds.push(cloud);
  }
};

const sleep = time => {
  return new Promise(resolve => setTimeout(resolve, time));
};

let resizing = false;

const resize = () => {
  if (!resizing) {
    resizing = true;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    sleep(300).then(() => {
      initScene();
      resizing = false;
    });
  }
};
window.addEventListener("resize", resize, false);
resize();

initScene();
loop.start();
