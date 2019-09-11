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

import { Sprite } from "kontra";
import { imageFromSvg, random } from "./utils.js";
import enemySvg from "./images/enemy.svg";
import enemyHitSvg from "./images/enemyHit.svg";

const enemyImage = imageFromSvg(enemySvg);
const enemyHitImage = imageFromSvg(enemyHitSvg);

export const createEnemy = platform => {
  return Sprite({
    width: 30,
    height: 80,
    color: "black",
    dx: random(6) + 1,
    image: enemyImage,

    update() {
      this.advance();
      let speed = this.dx;
      if (platform.x + platform.width - this.width < this.x) {
        this.dx = -speed;
      } else if (this.x < platform.x) {
        this.dx = -speed;
      }
    },
    render() {
      this.context.save();
      this.context.translate(this.x, this.y);
      this.context.drawImage(this.image, 0, 0);
      this.context.restore();
    },
    collidesWith(object) {
      const xMargin = 10;
      const yMargin = 20;
      return (
        this.x < object.x + object.width - xMargin &&
        this.x + this.width - xMargin > object.x &&
        this.y < object.y + object.height - yMargin &&
        this.y + this.height - yMargin > object.y
      );
    },
    hit() {
      this.image = enemyHitImage;
      setTimeout(() => {
        this.image = enemyImage;
      }, 1000);
    }
  });
};
