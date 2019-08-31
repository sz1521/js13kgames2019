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

export const createCamera = (level, canvas) => {
  return {
    x: 0,
    y: 0,
    zoom: 1,

    follow(target) {
      this.zoom = 1;
      this.target = target;
    },

    zoomToLevel() {
      this.target = null;

      this.x = level.left + level.width / 2;
      this.y = level.top + level.height / 2;

      if (level.width / level.height >= canvas.width / canvas.height) {
        this.zoom = canvas.width / level.width;
      } else {
        this.zoom = canvas.height / level.height;
      }
    },

    update() {
      if (this.target) {
        let newX, newY;

        newX = this.target.x + this.target.width;
        newY = this.target.y + this.target.height;

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
      }
    }
  };
};
