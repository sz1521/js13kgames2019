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

export const createPortal = () => {
  return Sprite({
    width: 200,
    height: 200,
    colorValue: 0,
    colorUp: true,

    render() {
      this.context.globalAlpha = 0.7;
      this.context.fillStyle =
        "rgb(255,150," + this.colorValue.toString() + ")";
      this.context.fillRect(this.x, this.y, this.width, this.height);
      this._oscillateColor();
      this.context.globalAlpha = 1;
    },

    collidesWith(object) {
      const xMargin = this.width * (3 / 8);
      const yMargin = this.height * (3 / 8);
      return (
        this.x < object.x + object.width - xMargin &&
        this.x + this.width - xMargin > object.x &&
        this.y < object.y + object.height - yMargin &&
        this.y + this.height - yMargin > object.y
      );
    },

    _oscillateColor() {
      if (this.colorUp) {
        if (this.colorValue < 255) {
          this.colorValue++;
        } else {
          this.colorUp = false;
        }
      } else {
        if (this.colorValue > 0) {
          this.colorValue--;
        } else {
          this.colorUp = true;
        }
      }
    }
  });
};
