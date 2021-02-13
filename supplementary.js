Array.prototype.pick = function () { return this[Math.floor(Math.random() * (this.length - 1))] };

Object.defineProperty(Array.prototype, 'first', {

	get () { return this[0] },

	set (value) { this.unshift(value) }

});

Object.defineProperty(Array.prototype, 'last', {

	get () { return this[this.length - 1] },

	set (value) { this[this.length] = value }

});

Array.prototype.remove = function (item) {

	if (!this.includes(item)) console.warn(`Tried to remove item ${item} from array ${this} but array does not contain item.`);

	this.splice(this.indexOf(item), 1);

	return this;

};

Array.prototype.shuffle = function () {

	for (let index = this.length - 1; index > 0; index--) {

		let random = Math.floor(Math.random() * (index + 1));

		[this[index], this[random]] = [this[random], this[index]];

	};

	return this;

};

Array.through = function (length = 0, from = 0, step = 1) {

	return Array.from("0".repeat(length)).map((item, index) => from + (index * step));

};

// String.prototype.belongsTo = function (array) { return array.includes(this.valueOf()) };

Object.prototype.belongsTo = function (array) { return array.includes(this.valueOf()) };

Number.prototype.ms = function () { return this * 1000 };

Object.prototype.pipe = function (fn) { return fn(this.valueOf()) };