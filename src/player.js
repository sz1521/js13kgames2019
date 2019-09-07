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
import { imageFromSvg } from "./utils.js";
import playerSvg from "./images/player.svg";
import playerLeftfootSvg from "./images/player-leftfoot.svg";
import playerverticalSvg from "./images/player-vertical.svg";
import playerverticalLeftfootSvg from "./images/player-vertical-leftfoot.svg";

const PLAYER_SPEED = 7;
const JUMP_VELOCITY = -15;
const CLIMB_SPEED = 2;

const GRAVITY = 2;
const SMALL_GRAVITY = 0.5;

const STANDING_WIDTH = 30;
const STANDING_HEIGHT = 90;

const STATE_ON_PLATFORM = 0;
const STATE_FALLING = 1;
const STATE_CLIMBING = 2;
const STATE_DEAD = 3;

const playerImage = imageFromSvg(playerSvg);
const playerLeftfootImage = imageFromSvg(playerLeftfootSvg);
const playerverticalImage = imageFromSvg(playerverticalSvg);
const playerverticalLeftfootImage = imageFromSvg(playerverticalLeftfootSvg);

export const createPlayer = level => {
  return Sprite({
    width: STANDING_WIDTH,
    height: STANDING_HEIGHT,
    xVel: 0, // Horizontal velocity
    yVel: 0, // Vertical velocity, affected by jumping and gravity
    state: STATE_ON_PLATFORM,
    fallingToGround: false,
    stopClimbing: false,
    moveLeft: false,
    moveLeftFoot: 0,
    image: playerImage,
    walkingSpeed: 5,
    ag: 2, // Anti-gravity status (0 = off, 1 = warn, 2 = on)

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
      } else if (this.state === STATE_CLIMBING) {
        if (this.moveLeftFoot < 5) {
          this.image = playerverticalImage;
        } else {
          this.image = playerverticalLeftfootImage;
        }
      } else {
        if (this.moveLeft) {
          this.context.translate(this.image.width / 2, 0);
          this.context.scale(-1, 1); // mirror player
          this.context.translate(-this.image.width / 2, 0);
        }
        if (this.moveLeftFoot < this.walkingSpeed) {
          this.image = playerImage;
        } else {
          this.image = playerLeftfootImage;
        }
      }
      if (this.moveLeftFoot > this.walkingSpeed * 2) this.moveLeftFoot = 0;

      // scale image to player size
      this.context.scale(
        STANDING_WIDTH / this.image.width,
        STANDING_HEIGHT / this.image.height
      );
      this.context.drawImage(this.image, 0, 0);
      this.context.restore();
    },

    findLadderCollision(ladders) {
      let collision, collidesHigh;

      for (let i = 0; i < ladders.length; i++) {
        let ladder = ladders[i];

        if (ladder.collidesWith(this)) {
          collision = true;

          if (ladder.y < this.y && this.y < ladder.y + ladder.height) {
            // Top of the player sprite is on ladder
            collidesHigh = true;
          }
        }
      }

      return { collision, collidesHigh };
    },

    hit() {
      this.xVel = 20;
    },

    update(ladders, platforms, hittingEnemy, camera) {
      if (this.state === STATE_DEAD) {
        return;
      }

      const platform = this.findPlatform(platforms);
      let movement = { dx: 0, dy: 0 };

      let ladderCollision = this.findLadderCollision(ladders);

      if (hittingEnemy) {
        this.state = STATE_FALLING;
        if (!this.fallingToGround) {
          this.fallingToGround = true;
          this.turnHorizontally();
        }
      } else if (!ladderCollision.collision && this.state === STATE_CLIMBING) {
        this.state = STATE_FALLING;
      } else if (this.yVel > 60) {
        this.fallingToGround = true;
      } else if (!this.fallingToGround) {
        movement = this.handleControls(ladderCollision, platform);
      }

      let { dx, dy } = movement;

      if (this.xVel !== 0) {
        dx += this.xVel;
        if (this.xVel > 4) {
          this.xVel *= 0.97; // friction
        } else {
          this.xVel = 0;
        }
      }

      if (this.state === STATE_FALLING) {
        this.yVel += this.ag > 0 ? SMALL_GRAVITY : GRAVITY;
        dy += this.yVel;
      }

      if (dx !== 0) {
        this.x += dx;
      }

      if (this.y + dy > level.height - this.height) {
        // hits ground
        this.y = level.height - this.height;

        if (this.fallingToGround) {
          this._screenShake(camera);
          this.state = STATE_DEAD;
        } else {
          this.state = STATE_ON_PLATFORM;
        }

        this.yVel = 0;
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
        this.yVel = 0;
        this.state = STATE_ON_PLATFORM;
      } else {
        this.state = STATE_FALLING;
        this.y += dy;
      }
    },

    _screenShake(camera) {
      const topVel = 80;
      const maxPower = 20;
      const scaledPower =
        (Math.min(topVel, Math.max(this.yVel - 20, 0)) / topVel) * maxPower;
      camera.shake(scaledPower, 0.5);
    },

    turnHorizontally() {
      let oldWidth = this.width,
        oldHeight = this.height;
      this.width = oldHeight;
      this.height = oldWidth;
    },

    handleControls(ladderCollision, platform) {
      let dx = 0;
      let dy = 0;

      if (keyPressed("left") && this.x > 0) {
        dx = -PLAYER_SPEED;
        this.moveLeft = true;
        if (this.state !== STATE_FALLING) this.moveLeftFoot++;
      } else if (keyPressed("right") && this.x < level.width - this.width) {
        dx = PLAYER_SPEED;
        this.moveLeft = false;
        if (this.state !== STATE_FALLING) this.moveLeftFoot++;
      }

      const upPressed = keyPressed("up");

      if (!upPressed) {
        // Up key must be released to jump after reaching the top of
        // the stairs.
        this.stopClimbing = false;
      }
      if (upPressed && !this.stopClimbing) {
        if (
          this.state === STATE_CLIMBING &&
          dx === 0 &&
          platform &&
          !ladderCollision.collidesHigh
        ) {
          // Prevent jumping when reaching the top of the ladder,
          // unless another ladder continues from there.
          this.state = STATE_ON_PLATFORM;
          this.stopClimbing = true;
        } else if (
          this.state !== STATE_FALLING &&
          (platform || this.isOnGround()) &&
          !(dx === 0 && ladderCollision.collidesHigh)
        ) {
          this.yVel = JUMP_VELOCITY;
          this.state = STATE_FALLING;
        } else if (this.yVel >= 0 && ladderCollision.collision) {
          // Climb when not jumping
          this.state = STATE_CLIMBING;
          this.yVel = 0;
          dy -= CLIMB_SPEED;
        }
        if (this.state === STATE_CLIMBING) this.moveLeftFoot++;
      } else if (keyPressed("down") && ladderCollision.collision) {
        this.state = STATE_CLIMBING;
        this.yVel = 0;
        dy += CLIMB_SPEED;
        this.moveLeftFoot++;
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
