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

import { Sprite, keyPressed } from "kontra";

const playerSpeed = 5;
const gravity = 2;
const jumpVelocity = -30;
const climbSpeed = 2;

const STATE_ON_PLATFORM = 0;
const STATE_FALLING = 1;
const STATE_CLIMBING = 2;
const STATE_DEAD = 3;

export const createPlayer = (level, image) => {
  return Sprite({
    color: "red",
    width: 50,
    height: 150,
    vel: 0, // Vertical velocity, affected by jumping and gravity
    state: STATE_ON_PLATFORM,
    fallingToGround: false,

    isOnGround() {
      const margin = 5;
      return this.y + this.height > level.height - margin;
    },

    render() {
      this.context.save();
      this.context.translate(this.x, this.y);

      if (this.fallingToGround) {
        // Rotation is around top left corner, adjust accordingly:
        this.context.translate(0, this.height);

        this.context.rotate(-Math.PI / 2);
      }

      this.context.drawImage(image, 0, 0);
      this.context.restore();
    },

    update(canClimb, platforms, hittingEnemy, camera) {
      if (this.state === STATE_DEAD) {
        return;
      }

      const platform = this.findPlatform(platforms);
      let movement = { dx: 0, dy: 0 };

      if (hittingEnemy) {
        this.state = STATE_FALLING;
        if (!this.fallingToGround) {
          this.fallingToGround = true;
          this.turnHorizontally();
        }
      } else if (!canClimb && this.state === STATE_CLIMBING) {
        this.state = STATE_FALLING;
      } else if (!this.fallingToGround) {
        movement = this.handleControls(canClimb, platform);
      }

      let { dx, dy } = movement;

      if (this.state === STATE_FALLING) {
        this.vel += gravity;
        dy += this.vel;
      }

      if (dx !== 0) {
        this.x += dx;
      }

      if (this.y + dy > level.height - this.height) {
        // hits ground
        this.y = level.height - this.height;
        this.vel = 0;
        this.state = STATE_ON_PLATFORM;

        if (this.fallingToGround) {
          camera.shake(10, 1);
          this.state = STATE_DEAD;
        }
      } else if (this.fallingToGround) {
        this.state = STATE_FALLING;
        this.y += dy;
      } else if (this.state === STATE_CLIMBING) {
        this.y += dy;
      } else if (dy > 0 && platform && !hittingEnemy) {
        // Margin so that the player does not constantly toggle
        // between standing and free falling.
        const margin = 5;
        this.y = platform.y - this.height + margin;
        this.vel = 0;
        this.state = STATE_ON_PLATFORM;
      } else {
        this.state = STATE_FALLING;
        this.y += dy;
      }
    },

    turnHorizontally() {
      let oldWidth = this.width,
        oldHeight = this.height;
      this.width = oldHeight;
      this.height = oldWidth;
    },

    handleControls(canClimb, platform) {
      let dx = 0;
      let dy = 0;

      if (keyPressed("left") && this.x > 0) {
        dx = -playerSpeed;
      } else if (keyPressed("right") && this.x < level.width - this.width) {
        dx = playerSpeed;
      }

      if (keyPressed("up")) {
        if (canClimb) {
          this.state = STATE_CLIMBING;
          this.vel = 0;
          dy -= climbSpeed;
        } else if (
          this.state !== STATE_FALLING &&
          (platform || this.isOnGround())
        ) {
          this.vel = jumpVelocity;
          this.state = STATE_FALLING;
        }
      } else if (keyPressed("down") && canClimb) {
        this.state = STATE_CLIMBING;
        this.vel = 0;
        dy += climbSpeed;
      }

      return { dx, dy };
    },

    findPlatform(platforms) {
      for (let i = 0; i < platforms.length; i++) {
        let platform = platforms[i];
        if (this.collidesWith(platform)) {
          if (this.y + this.height < platform.y + platform.height) {
            return platform;
          }
        }
      }
    }
  });
};
