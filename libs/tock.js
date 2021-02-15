let delta = function (source = 0) {
  return Date.now() - source;
};

let Tock = function (options) {
  let defaults = {
    running: false,
    countdown: false,

    timeout: null,
    ticksMissed: null,

    interval: 100,

    time: {
      current: 0,

      started: 0,
      paused: 0,
      ended: 0,

      base: 0,
    },

    duration: 0,

    callback() {},
    complete() {},
  };

  Object.assign(this, defaults, options);

  if (!this instanceof Tock) return new Tock(options);
};

Tock.prototype._tick = function () {
  this.time.current += this.interval;

  if (this.countdown && this.duration - this.time.current < 0) {
    this.time.ended = 0;
    this.running = false;

    this.callback();

    clearTimeout(this.timeout);

    this.complete();

    return;
  } else {
    this.callback();
  }

  var diff = delta(this.time.started) - this.time.current,
    untilNextInterval = this.interval - Math.max(diff, 0);

  if (untilNextInterval <= 0) {
    this.ticksMissed = Math.floor(Math.abs(untilNextInterval) / this.interval);
    this.time.current += this.ticksMissed * this.interval;

    if (this.running) this._tick();
  } else if (this.running) {
    this.timeout = setTimeout(this._tick.bind(this), untilNextInterval);
  }
};

Tock.prototype._startCountdown = function (duration) {
  this.duration = duration;
  this.time.started = Date.now();
  this.time.current = 0;

  this.running = true;

  this._tick();
};

Tock.prototype._startTimer = function (offset) {
  this.time.started = offset || Date.now();
  this.time.current = 0;

  this.running = true;

  this._tick();
};

Tock.prototype.reset = function () {
  if (this.countdown) return false;

  this.stop();
  this.time.started = this.time.current = 0;
};

Tock.prototype.restart = function () {
  this.stop();
  this.start(this.time.base);
};

/**
 * Timer start/ accepta timp de pe un segment argumentat in "ms"
 * @param {Various} time
 */
Tock.prototype.start = function (time = 0) {
  if (this.running) return false;

  this.time.started = this.time.base = time;
  this.time.paused = 0;

  this.countdown ? this._startCountdown(time) : this._startTimer(delta(time));
};

Tock.prototype.stop = function () {
  this.time.paused = this.left();
  this.running = false;

  clearTimeout(this.timeout);

  this.time.ended = this.countdown
    ? this.duration - this.time.current
    : delta(this.time.started);
};

Tock.prototype.pause = function () {
  if (!this.running) return;

  this.time.paused = this.left();
  this.stop();
};

Tock.prototype.unpause = function () {
  if (!this.time.paused) return;

  this.countdown
    ? this._startCountdown(this.time.paused)
    : this._startTimer(delta(this.time.paused));

  this.time.paused = 0;
};

Tock.prototype.left = function () {
  if (!this.running) return this.time.paused || this.time.ended;

  let now = delta(this.time.started),
    left = Math.abs(!!this.countdown * this.duration - now);

  return left;
};

//FIXME elaborare pentru reducerea timp/frame pierdut in pauza (in special pe telefoane)
Tock.prototype.reduce = function (value) {
  this.duration = Math.max(this.duration - value, 0);
};
