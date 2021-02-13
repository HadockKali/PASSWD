Object.prototype.pipe = function (fn) { return fn(this.valueOf()) };

class InteractionHandler {

	constructor () {

		let instance = this;

		instance.registry = {};

		instance.evaluateCondition = function (condition, event) {

			if (condition == null) return true;

			let evaluation = condition.pipe(Object.entries).map(([property, value]) => InteractionHandler.conditions[property](value, event));

			return evaluation.every(item => item === true);

		};

		instance.eventRouter = function (event) {

			let type   = event.type,
				drawer = instance.registry[type];

			if (!drawer.length) return;

			for (const outcome of drawer) {

				let evaluation = instance.evaluateCondition(outcome.condition, event);

				if (!evaluation) continue;

				if ([...outcome.arguments].length) {

					outcome.function(...outcome.arguments);
				
				} else {

					outcome.function(event);

				};

			};

		};

	};

	static getModifierStates (event, list = InteractionHandler.modifiers) {

		let states = list.map(modifier => [modifier, event.getModifierState(modifier)]).pipe(Object.fromEntries);

		return states;

	};

	static getAliasForKey (key) {

		let entries = Object.entries(InteractionHandler.alias.keys);

		for (const [alias, association] of entries) {
			
			if (key == association) return alias;

			if (key.toLowerCase() == alias) return association;
		
		};

		return key;

	};

	static getAliasForEvent (type) {

		let entries = Object.entries(InteractionHandler.alias.events);

		for (const [alias, plurality] of entries) { if (type == alias) return plurality };

		return [type];

	};

	static modifiers = [

		"Alt",
		"AltGraph",
		"Control",
		"Meta",
		"Shift"

	];

	static alias = {

		keys: {

			space:   " ",
			option:  "Alt",
			command: "Meta",
			ctrl:    "Control",
			escape:  "Esc",
			plus:    "+",
			mod:     /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "Meta" : "Control"

		},

		events: {

			press:       [ "click",     "tap"        ],
			swipe:       [ "swipeup",   "swipedown", "swipeleft", "swiperight" ],

			pointerdown: [ "mousedown", "touchstart" ],
			pointermove: [ "mousemove", "touchmove"  ],
			pointerup:   [ "mouseup",   "touchend"   ]

		}

	};

	static conditions = {

		// * each condition must return a single `true` or `false`

		"modifiers": function (condition, event) {

			let state = InteractionHandler.getModifierStates(event).pipe(Object.entries);

			let result = state.filter(([property, value]) => {
				
				return property.toLowerCase() in condition || InteractionHandler.getAliasForKey(property) in condition;
			
			}).map(([property, value]) => {

				let alias = InteractionHandler.getAliasForKey(property),
					name  = alias in condition ? alias : property.toLowerCase();
				
				return condition[name] == value;
			
			});

			return result.every(item => item === true);

		},

		"target": function (condition, event) {

			return event.target.matches(condition);

		},

		"key": function (condition, event) {

			return event.key.toLowerCase() == condition || InteractionHandler.getAliasForKey(event.key) == condition;

		}

	};

	register (event, condition, fn, ...args) {

		let response = {

			condition,
			function: fn,
			arguments: [...args]

		};

		let events = InteractionHandler.getAliasForEvent(event);

		for (const type of events) {

			if (!this.registry[type]) {
				
				this.registry[type] = [];

				document.addEventListener(type, this.eventRouter);
			
			};
			
			this.registry[type].push(response);
		
		};

		return response;

	};

};