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

export const createDrone = player => {
  return Sprite({
    width: 60,
    height: 60,
    color: "black",
    player: player,

    update() {
      this.advance();

      const xDiff = player.x + player.width - (this.x + this.width);
      const yDiff = player.y + player.height - (this.y + this.height);

      this.dx = Math.sign(xDiff);
      this.dy = Math.sign(yDiff);
    },

    render() {
      this.context.beginPath();
      this.context.fillStyle = "rgb(60,60,60)";
      this.context.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2,
        0,
        Math.PI * 2
      );
      this.context.fill();

      this.context.beginPath();
      this.context.fillStyle = "rgb(0,0,0)";
      this.context.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width * 0.4,
        0,
        Math.PI * 2
      );
      this.context.fill();
    },

    collidesWith(object) {
      const xMargin = 20;
      const yMargin = 20;
      return (
        this.x < object.x + object.width - xMargin &&
        this.x + this.width - xMargin > object.x &&
        this.y < object.y + object.height - yMargin &&
        this.y + this.height - yMargin > object.y
      );
    }
  });
};
