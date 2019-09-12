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
import { imageFromSvg, random } from "./utils.js";
import { playTune } from "./music.js";
import playerSvg from "./images/player.svg";
import playerLeftfootSvg from "./images/player-leftfoot.svg";
import playerverticalSvg from "./images/player-vertical.svg";
import playerverticalLeftfootSvg from "./images/player-vertical-leftfoot.svg";

const PLAYER_SPEED = 7;
const JUMP_VELOCITY = -15;
const CLIMB_SPEED = 2;
const DEADLY_FALLING_SPEED = 40;

const OFF_LEDGE_JUMP_DELAY_MS = 200;

const GRAVITY = 1;
const SMALL_GRAVITY = 0.5;

const STANDING_WIDTH = 30;
const STANDING_HEIGHT = 90;

const STATE_ON_PLATFORM = 0;
const STATE_FALLING = 1;
const STATE_CLIMBING = 2;
const STATE_DEAD = 3;
const STATE_SWIRLING = 4;

export const MAX_ENERGY = 10000;

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
    latestOnPlatformTime: 0,
    state: STATE_ON_PLATFORM,
    fallingToGround: false,
    stopClimbing: false,
    moveLeft: false,
    moveLeftFoot: 0,
    image: playerImage,
    walkingSpeed: 5,
    ag: false, // Anti-gravity status
    energy: MAX_ENERGY,
    timeTravelFrames: 0,
    swirlingStartTime: undefined,
    swirlingAngle: 0,
    hidden: false,
    isTimeTravelling: false,

    isOnGround() {
      const margin = 5;
      return this.y + this.height > level.height - margin;
    },

    isDead() {
      return this.state === STATE_DEAD;
    },

    isSwirling() {
      return this.state === STATE_SWIRLING;
    },

    swirl() {
      if (this.state != STATE_SWIRLING) {
        this.state = STATE_SWIRLING;
        this.swirlingStartTime = performance.now();
      }
    },

    render() {
      if (this.hidden) {
        return;
      }

      this.context.save();
      this.context.translate(this.x, this.y);
      if (this.isTimeTravelling) {
        this.context.translate(random(10), random(10));
      }

      if (this.state === STATE_SWIRLING) {
        const scaling = 0.6 + Math.sin(this.swirlingAngle) * 0.4;
        this.context.scale(scaling, scaling);
        this.context.rotate(this.swirlingAngle);
        this.context.translate(-this.width / 2, -this.height / 2);
        this.swirlingAngle += Math.PI / 32;
      } else if (this.fallingToGround) {
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

    _findLadderCollision(ladders) {
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

    hit(velocity) {
      if (Math.abs(this.xVel) < 100) {
        this.xVel += velocity;
      }
    },

    update(ladders, platforms, camera) {
      if (this.state === STATE_DEAD) {
        return;
      }

      const now = performance.now();

      if (this.state === STATE_SWIRLING) {
        if (!this.hidden && now - this.swirlingStartTime > 500) {
          this.hidden = true;
          this.y = -200;
        }
        return;
      }

      const platform = this._findPlatform(platforms);
      if (platform) {
        this.latestOnPlatformTime = now;
      }

      let movement = { dx: 0, dy: 0 };

      let ladderCollision = this._findLadderCollision(ladders);

      if (!ladderCollision.collision && this.state === STATE_CLIMBING) {
        this.state = STATE_FALLING;
      } else if (this.yVel > DEADLY_FALLING_SPEED && !this.ag) {
        if (!this.fallingToGround) {
          this.fallingToGround = true;
          this._turnHorizontally();
        }
      } else if (!this.fallingToGround) {
        movement = this._handleControls(now, ladderCollision, platform);
      }

      let { dx, dy } = movement;

      if (this.xVel !== 0) {
        dx += this.xVel;
        if (Math.abs(this.xVel) > 4) {
          this.xVel *= 0.97; // friction
        } else {
          this.xVel = 0;
        }
      }

      if (this.state === STATE_FALLING) {
        this.yVel += this.ag ? SMALL_GRAVITY : GRAVITY;
        dy += this.yVel;
      }

      this._updateHorizontalPosition(dx);
      this._updateVerticalPosition(camera, platform, dy);
    },

    _screenShake(camera) {
      const topVel = 80;
      const maxPower = 20;
      const scaledPower =
        (Math.min(topVel, Math.max(this.yVel - 20, 0)) / topVel) * maxPower;
      camera.shake(scaledPower, 0.5);
    },

    _turnHorizontally() {
      let oldWidth = this.width,
        oldHeight = this.height;
      this.width = oldHeight;
      this.height = oldWidth;
    },

    _handleControls(now, ladderCollision, platform) {
      let dx = 0;
      let dy = 0;

      if ((keyPressed("left") || keyPressed("a")) && this.x > 0) {
        dx = -PLAYER_SPEED;
        this.moveLeft = true;
        if (this.state !== STATE_FALLING) this.moveLeftFoot++;
      } else if (
        (keyPressed("right") || keyPressed("d")) &&
        this.x < level.width - this.width
      ) {
        dx = PLAYER_SPEED;
        this.moveLeft = false;
        if (this.state !== STATE_FALLING) this.moveLeftFoot++;
      }

      const upPressed = keyPressed("up") || keyPressed("w");
      if (!upPressed) {
        // Up key must be released to jump after reaching the top of
        // the stairs.
        this.stopClimbing = false;
      }
      if (
        (upPressed && !this.stopClimbing) ||
        keyPressed("space") ||
        keyPressed("g")
      ) {
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
          (platform ||
            now - this.latestOnPlatformTime < OFF_LEDGE_JUMP_DELAY_MS ||
            this.isOnGround()) &&
          !(dx === 0 && ladderCollision.collidesHigh)
        ) {
          this.yVel = JUMP_VELOCITY;
          this.state = STATE_FALLING;
          this.latestOnPlatformTime = 0;
        } else if (this.yVel >= 0 && ladderCollision.collision) {
          // Climb when not jumping
          this.state = STATE_CLIMBING;
          this.yVel = 0;
          dy -= CLIMB_SPEED;
        }
        if (this.state === STATE_CLIMBING) this.moveLeftFoot++;
      } else if (
        (keyPressed("down") || keyPressed("s")) &&
        ladderCollision.collision
      ) {
        this.state = STATE_CLIMBING;
        this.yVel = 0;
        dy += CLIMB_SPEED;
        this.moveLeftFoot++;
      }

      return { dx, dy };
    },

    _updateHorizontalPosition(dx) {
      if (this.x + dx > level.width - this.width) {
        this.x = level.width - this.width;
        this.xVel = 0;
      } else if (this.x + dx < level.left) {
        this.x = level.left;
        this.xVel = 0;
      } else if (dx !== 0) {
        this.x += dx;
      }
    },

    _updateVerticalPosition(camera, platform, dy) {
      if (this.y + dy > level.height - this.height) {
        // hits ground
        this.y = level.height - this.height;

        if (this.fallingToGround) {
          this._screenShake(camera);
          this.state = STATE_DEAD;
          playTune("end");
        } else {
          this.state = STATE_ON_PLATFORM;
        }

        this.yVel = 0;
      } else if (this.fallingToGround) {
        this.state = STATE_FALLING;
        this.y += dy;
      } else if (this.state === STATE_CLIMBING) {
        this.y += dy;
      } else if (dy > 0 && platform) {
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

    _findPlatform(platforms) {
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
