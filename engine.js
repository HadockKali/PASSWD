let $playfield = document.querySelector(".playfield"),
  $score = document.querySelector(".score"),
  $countdown = document.querySelector(".countdown"),
  $screen = {
    menu: document.querySelector(".menu"),
  };

let mobile = isMobile().any;
<<<<<<< HEAD
// main kbd = desktop keyboard | lista de posibilitati combinatii
=======
// main kbd = desktop keyboard lista de posibilitati combinatii
>>>>>>> main
let Password = {
  current: [],

  elements: [...document.querySelectorAll("main kbd")],

  type: mobile,

  alphabet: [
    "0","1","2","3",
    "4","5","6","7",
    "8","9","a","b",
    "c","d","e","f",
    "g","h","j","k",
    "m","n","p","q",
    "r","s","t","v",
    "w","x","y","z",
  ],

  solved() {
    return Password.current.every((cell) => cell.solved);
  },
// modul generare combinatii
  generate() {
    let keys = Password.type
      ? Array.through(Game.difficulty.length, 1)
          .map((key) => key.toString())
          .shuffle()
      : Password.alphabet.shuffle().slice(0, Game.difficulty.length);

    Password.current = keys.map((key, index) =>
      [
        ["key", key],
        ["element", Password.elements[index]],
        ["solved", false],
      ].pipe(Object.fromEntries)
    );
  },
};

let Game = {
  status: "initial",

  timer: null,

  countup: null,
// de aici se poate ajusta dificultatea in functie de timp si lungime string
  difficulty: {
    time: 5, //5 default
    length: 8, //8 default

    set: {
      time(value) {
        Game.difficulty.time = value;
      },
      length(value) {
        Game.difficulty.length = value;
      },
    },
  },

  score: {
    current: null,

    highest: 0,

    add(value) {
      Game.score.current += value;

      DOMNegotiator.score();
    },

    reset() {
      Game.score.highest = Math.max(Game.score.current, Game.score.highest);

      Game.score.current = 0;

      DOMNegotiator.score();
    },
  },

  tick() {
    let elapsed = Game.timer.left(),
      total = Game.difficulty.time.ms(),
      percentage = (elapsed / total) * 100,
      width = Math.max(percentage, 0);

    $countdown.style.width = `${width}%`;
  },

  initialize() {
    let root = document.documentElement;

    let options = {
      tock: {
        countdown: true,
        interval: 16,

        callback: Game.tick,
        complete: Game.lose,
      },

      countup: {
        duration: 1,

        separator: "",
      },

      fitty: {
        maxSize: mobile
          ? Math.max(root.clientWidth, root.clientHeight) * 0.9
          : 22 * 16,
      },
    };

    Game.timer = new Tock(options.tock);

    Game.countup = new CountUp($score, Game.score.current, options.countup);

    Game.fitty = fitty($score, options.fitty);

    if (mobile) document.body.classList.add("mobile");
  },

  resolve() {
    ActionHandler._pressed = [];

    Password.generate();

    DOMNegotiator.reset();

    DOMNegotiator.render();

    Game.timer.time.base
      ? Game.timer.restart()
      : Game.timer.start(Game.difficulty.time.ms());

    Game.status = "ongoing";
  },
// Triggers pentru eventuri

//fs lose
  lose() {
    $playfield.classList.add("failed");

    Game.status = "lost";
  },

  //fs succeed
  succeed() {
    let reward = (Game.difficulty.length / Game.difficulty.time) * 20;

    Game.score.add(reward);

    Game.resolve();
  },

  //fs start
  start() {
    Game.score.reset();

    Game.resolve();

    $screen.menu && $screen.menu.classList.add("hidden");

    $score.classList.add("visible");
  },

  //fs pause
  pause() {
    Game.timer.pause();

    $playfield.classList.add("paused");

    Game.status = "paused";
  },

  //fs unpause
  unpause() {
    Game.timer.unpause();

    $playfield.classList.remove("paused");

    Game.status = "ongoing";
  },
/* Formula pentru key-uri gresite:
 * penalty == (<time_in_ms> / 10) == (<time_in_s> * 100)
 */
  foul() {
    let penalty = Game.difficulty.time * 100;

    Game.timer.reduce(penalty);

    $playfield.classList.add("foul");

    setTimeout(() => $playfield.classList.remove("foul"), 125);
  },

  settings() {},

  load() {},

  save() {},
};
// actiuni/event-uri
let ActionHandler = {
  _pressed: [],

  contextual() {
    let action = {
      initial: Game.start,
      lost: Game.start,

      ongoing: Game.pause,
      paused: Game.unpause,
    };

    action[Game.status]();
  },
// mobile things TODO: de schimbat swipe down in instantele chrome mobile forteaza 2 actiuni, una dintre acestea este refresh.
  swipeup() {
    let action = {
      initial: Game.start,
      lost: Game.start,

      ongoing: function () {},
      paused: Game.unpause,
    };

    action[Game.status]();
  },
// FIXME: de rectificat (vezi TODO de mai sus)
  swipedown() {
    if (Game.status == "ongoing") Game.pause();
  },

  keydown(event) {
    if (Game.status != "ongoing") return;

    let key = event.key.toLowerCase(),
      hotkeys = handler.registry.keydown.map(
        (response) =>
          response.condition && response.condition.key && response.condition.key
      ),
      isHotkey =
        InteractionHandler.getAliasForKey(key).belongsTo(hotkeys) ||
        key.belongsTo(hotkeys);

    if (isHotkey) return;

    let cell = Password.current.find((cell) => cell.key == key);

    if (cell) {
      let element = cell.element;

      cell.solved = true;

      if (Password.solved()) {
        Game.succeed();

        return;
      }

      ActionHandler._pressed.last = element;

      DOMNegotiator.negotiate(cell);
    } else {
      Game.foul();
    }
  },

  keyup(event) {
    let key = event.key,
      cell = Password.current.find((cell) => cell.key == key);

    if (cell) {
      if (!ActionHandler._pressed.length) return;

      let element = cell.element;

      if (element.belongsTo(ActionHandler._pressed))
        ActionHandler._pressed.remove(element);

      DOMNegotiator.negotiate(cell);
    }
  },

  pointerdown(event) {
    if (Password.type == false || Game.status != "ongoing") return;

    let target = event.target;

    if (!target.matches("article main kbd")) return;

    let key = target.textContent,
      cell = Password.current.find((cell) => cell.key == key),
      previous = Password.current.find(
        (cell) => cell.key == key.pipe(parseInt) - 1
      ),
      inOrder = previous ? previous.solved : key == "1";

    if (cell && inOrder) {
      cell.solved = true;

      if (Password.solved()) Game.succeed();
    } else {
      Game.foul();
    }

    ActionHandler._pressed.last = cell.element;

    DOMNegotiator.negotiate(cell);
  },

  pointerup(event) {
    if (Password.type == false || Game.status != "ongoing") return;

    let target = event.target;

    if (!target.matches("article main kbd")) return;

    let key = target.textContent,
      cell = Password.current.find((cell) => cell.key == key);

    if (cell) {
      if (!ActionHandler._pressed.length) return;

      let element = cell.element;

      if (element.belongsTo(ActionHandler._pressed))
        ActionHandler._pressed.remove(element);

      DOMNegotiator.negotiate(cell);
    }
  },
};

let DOMNegotiator = {
  render() {
    for (cell of Password.current)
      cell.element.querySelector("span").textContent = cell.key;
  },

  reset() {
    for (cell of Password.current) cell.element.classList.remove("solved");

    $playfield.classList.remove("failed");
  },

  score() {
    if (Game.score.current) $score.classList.add("visible");

    Game.countup.update(Game.score.current);
  },

  negotiate(cell) {
    let element = cell.element,
      pressed = element.belongsTo(ActionHandler._pressed);

    if (pressed) {
      element.classList.add("pressed");

      cell.solved
        ? element.classList.add("solved")
        : element.classList.remove("solved");
    } else {
      element.classList.remove("pressed");
    }
  },
};

let gesture = new TinyGesture();

let handler = new InteractionHandler();

handler.register("keydown", { key: "space" }, ActionHandler.contextual);
handler.register("keydown", { key: "mod" }, Game.settings);
// in caz de apasari accidentale anti-foul module
handler.register("keydown", { key: "shift" }, function () {
  /* noop */
});
handler.register("keydown", { key: "alt" }, function () {
  /* noop */
});

handler.register("keydown", null, ActionHandler.keydown);
handler.register("keyup", null, ActionHandler.keyup);

handler.register("DOMContentLoaded", null, Game.initialize);
handler.register("beforeunload", null, Game.save);

handler.register("swipeup", null, ActionHandler.swipeup);
handler.register("swipedown", null, ActionHandler.swipedown);

handler.register("pointerdown", null, ActionHandler.pointerdown);
handler.register("pointerup", null, ActionHandler.pointerup);
