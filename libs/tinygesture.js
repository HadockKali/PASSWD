class TinyGesture {
	
	constructor (element = document, options) {
		
		options = Object.assign({}, TinyGesture.defaults, options);
		
		this.element = element;
		this.options = options;
		
		this.touchStartX = null;
		this.touchStartY = null;
		
		this.touchEndX = null;
		this.touchEndY = null;
		
		this.velocityX = null;
		this.velocityY = null;
		
		this.longPressTimer = null;
		
		this.doubleTapWaiting = false;
		
		this._onTouchStart = this.onTouchStart.bind(this);
		this._onTouchMove  = this.onTouchMove.bind(this);
		this._onTouchEnd   = this.onTouchEnd.bind(this);
		
		this.element.addEventListener('touchstart', this._onTouchStart, passiveIfSupported);
		this.element.addEventListener('touchmove',  this._onTouchMove,  passiveIfSupported);
		this.element.addEventListener('touchend',   this._onTouchEnd,   passiveIfSupported);
		
	};

	fire (type, data) {
		
		let event = new CustomEvent(type, { detail: data });

		this.element.dispatchEvent(event);

	}
	
	destroy () {
		
		clearTimeout(this.longPressTimer);
		clearTimeout(this.doubleTapTimer);
		
	}
	
	onTouchStart (event) {
		
		this.thresholdX = this.options.threshold('x', this);
		this.thresholdY = this.options.threshold('y', this);
		
		this.disregardVelocityThresholdX = this.options.disregardVelocityThreshold('x', this);
		this.disregardVelocityThresholdY = this.options.disregardVelocityThreshold('y', this);
		
		this.touchStartX = event.changedTouches[0].screenX;
		this.touchStartY = event.changedTouches[0].screenY;
		
		this.touchMoveX = null;
		this.touchMoveY = null;
		
		this.touchEndX = null;
		this.touchEndY = null;
		

		this.longPressTimer = setTimeout(() => this.fire('longpress', event), this.options.longPressTime);
		
		this.fire('panstart', event);
		
	}
	
	onTouchMove (event) {
		
		const touchMoveX = event.changedTouches[0].screenX - this.touchStartX;
		
		this.velocityX   = touchMoveX - this.touchMoveX;
		this.touchMoveX  = touchMoveX;
		
		const touchMoveY = event.changedTouches[0].screenY - this.touchStartY;
		
		this.velocityY   = touchMoveY - this.touchMoveY;
		this.touchMoveY  = touchMoveY;
		
		const absTouchMoveX = Math.abs(this.touchMoveX);
		const absTouchMoveY = Math.abs(this.touchMoveY);
		
		this.swipingHorizontal = absTouchMoveX > this.thresholdX;
		this.swipingVertical   = absTouchMoveY > this.thresholdY;
		
		this.swipingDirection = absTouchMoveX > absTouchMoveY
									? this.swipingHorizontal 
										? 'horizontal'
										: 'pre-horizontal'
									: this.swipingVertical
										? 'vertical' 
										: 'pre-vertical';
		
		let isMoveBeyondThreshold = Math.max(absTouchMoveX, absTouchMoveY) > this.options.pressThreshold;
		if (isMoveBeyondThreshold) clearTimeout(this.longPressTimer);
		
		this.fire('panmove', event);
		
	};
	
	onTouchEnd (event) {

		this.touchEndX = event.changedTouches[0].screenX;
		this.touchEndY = event.changedTouches[0].screenY;
		
		this.fire('panend', event);
		
		clearTimeout(this.longPressTimer);
		
		const x = this.touchEndX - this.touchStartX;
		const absX = Math.abs(x);

		const y = this.touchEndY - this.touchStartY;
		const absY = Math.abs(y);
		
		if (absX > this.thresholdX || absY > this.thresholdY) {
			
			this.swipedHorizontal = this.options.diagonalSwipes 
										? Math.abs(x / y) <= this.options.diagonalLimit 
										: absX >= absY && absX > this.thresholdX;
			
			this.swipedVertical = this.options.diagonalSwipes 
										? Math.abs(y / x) <= this.options.diagonalLimit 
										: absY > absX && absY > this.thresholdY;
			
			if (this.swipedHorizontal) {

				if (x < 0) {
					

					if (this.velocityX < -this.options.velocityThreshold || x < -this.disregardVelocityThresholdX) {
						
						this.fire('swipeleft', event);
						
					}
					
				} else {
					

					if (this.velocityX > this.options.velocityThreshold || x > this.disregardVelocityThresholdX) {
						
						this.fire('swiperight', event);
						
					}
					
				}
				
			}
			
			if (this.swipedVertical) {

				if (y < 0) {
					

					if (this.velocityY < -this.options.velocityThreshold || y < -this.disregardVelocityThresholdY) {

						this.fire('swipeup', event);

					}
					
				} else {
					

					if (this.velocityY > this.options.velocityThreshold || y > this.disregardVelocityThresholdY) {

						this.fire('swipedown', event);

					}
					
				}
				
			}
			
		} else if (absX < this.options.pressThreshold && absY < this.options.pressThreshold) {
			

			if (this.doubleTapWaiting) {
				
				this.doubleTapWaiting = false;
				clearTimeout(this.doubleTapTimer);

				this.fire('doubletap', event);
				
			} else {
				
				this.doubleTapWaiting = true;
				this.doubleTapTimer = setTimeout(() => this.doubleTapWaiting = false, this.options.doubleTapTime);

				this.fire('tap', event);
				
			}
			
		}
		
	}
	
}

TinyGesture.defaults = {
	
	threshold: type => Math.max(25, Math.floor(0.15 * (type === 'x' ? window.innerWidth || document.body.clientWidth : window.innerHeight || document.body.clientHeight))),
	
	velocityThreshold: 5,
	
	disregardVelocityThreshold: (type, self) => Math.floor(0.5 * (type === 'x' ? self.element.clientWidth : self.element.clientHeight)),
	
	pressThreshold: 8,
	
	diagonalSwipes: false,
	diagonalLimit: Math.tan(45 * 1.5 / 180 * Math.PI),
	
	longPressTime: 500,
	doubleTapTime: 300
	
};


let passiveIfSupported = false;

try {

	window.addEventListener('test', null, Object.defineProperty({}, 'passive', {

		get () { passiveIfSupported = { passive: true } }

	}));

} catch(err) {}