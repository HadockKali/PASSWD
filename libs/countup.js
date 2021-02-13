class CountUp {
    
    constructor (target, endVal, options) {
        
        let instance = this;
        
        instance.target = target;
        instance.endVal = endVal;
        instance.options = options;
        instance.version = '2.0.4';
        
        instance.defaults = {
            
            startVal: 0,
            
            decimalPlaces: 0,
            
            duration: 2,
            
            easing: true,
            grouping: true,
            
            smartEasingThreshold: 999,
            smartEasingAmount: 333,
            
            separator: ',',
            decimal: '.',
            
            prefix: '',
            suffix: ''
            
        };
        
        instance.finalEndVal = null; // for smart easing
        instance.easing = true;
        instance.countDown = false;
        instance.error = '';
        instance.startVal = 0;
        instance.paused = true;
        
        instance.count = function (timestamp) {
            
            if (!instance.startTime) instance.startTime = timestamp;
            
            var progress = timestamp - instance.startTime;
            
            instance.remaining = instance.duration - progress;
            
            // to ease or not to ease
            if (instance.easing) {
                
                if (instance.countDown) {
                    
                    instance.frameVal = instance.startVal - instance.easingFn(progress, 0, instance.startVal - instance.endVal, instance.duration);
                    
                } else {
                    
                    instance.frameVal = instance.easingFn(progress, instance.startVal, instance.endVal - instance.startVal, instance.duration);
                    
                }
                
            } else {
                
                if (instance.countDown) {
                    
                    instance.frameVal = instance.startVal - ((instance.startVal - instance.endVal) * (progress / instance.duration));
                    
                } else {
                    
                    instance.frameVal = instance.startVal + (instance.endVal - instance.startVal) * (progress / instance.duration);
                    
                }
                
            };
            
            // don't go past endVal since progress can exceed duration in the last frame
            if (instance.countDown) {
                
                instance.frameVal = (instance.frameVal < instance.endVal) ? instance.endVal : instance.frameVal;
                
            } else {
                
                instance.frameVal = (instance.frameVal > instance.endVal) ? instance.endVal : instance.frameVal;
                
            };
            
            // decimal
            instance.frameVal = Math.round(instance.frameVal * instance.decimalMult) / instance.decimalMult;
            
            // format and print value
            instance.printValue(instance.frameVal);
            
            // whether to continue
            if (progress < instance.duration) {
                
                instance.rAF = requestAnimationFrame(instance.count);
                
            } else if (instance.finalEndVal !== null) {
                
                // smart easing
                instance.update(instance.finalEndVal);
                
            } else if (instance.callback) {
                
                instance.callback();
                
            };
            
        };
        
        // default format and easing functions
        instance.formatNumber = function (num) {
            
            var neg = num < 0 ? '-' : '';
            
            let x3;
            
            let result = Math.abs(num).toFixed(instance.options.decimalPlaces).toString();
            // result += '';
            
            let x = result.split('.');
            
            let x1 = x[0];
            
            let x2 = x.length > 1 ? instance.options.decimal + x[1] : '';
            
            if (instance.options.grouping) {
                
                x3 = '';
                
                for (var i = 0, len = x1.length; i < len; ++i) {
                    
                    if (i !== 0 && (i % 3) === 0) x3 = instance.options.separator + x3;
                    
                    x3 = x1[len - i - 1] + x3;
                    
                }
                
                x1 = x3;
                
            };
            
            // optional numeral substitution
            if (instance.options.numerals && instance.options.numerals.length) {
                
                x1 = x1.replace(/[0-9]/g, function (w) { return instance.options.numerals[+w]; });
                x2 = x2.replace(/[0-9]/g, function (w) { return instance.options.numerals[+w]; });
                
            };
            
            return neg + instance.options.prefix + x1 + x2 + instance.options.suffix;
            
        };
        
        instance.easeOutExpo = function (t, b, c, d) {
            return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
        };
        
        instance.options = Object.assign({}, instance.defaults, options);
        
        instance.formattingFn = instance.options.formattingFn
                                                ? instance.options.formattingFn
                                                : instance.formatNumber;
                                                
        instance.easingFn = instance.options.easingFn
                                        ? instance.options.easingFn 
                                        : instance.easeOutExpo;
                                        
        instance.startVal = instance.validateValue(instance.options.startVal);
        instance.frameVal = instance.startVal;
        instance.endVal = instance.validateValue(endVal);
        
        instance.options.decimalPlaces = Math.max(0, instance.options.decimalPlaces);
        
        instance.decimalMult = Math.pow(10, instance.options.decimalPlaces);
        
        instance.resetDuration();
        
        instance.options.separator = String(instance.options.separator);
        
        instance.easing = instance.options.easing;
        
        if (instance.options.separator === '') instance.options.grouping = false;
        
        instance.el = typeof target === 'string'
                                        ? document.getElementById(target) 
                                        : target;
        
        if (instance.el) {
            
            instance.printValue(instance.startVal);
            
        } else {
            
            instance.error = '[CountUp] target is null or undefined';
            
        };
        
    };
    
    // determines where easing starts and whether to count down or up
    determineDirectionAndSmartEasing () {
        
        var end = this.finalEndVal 
                                ? this.finalEndVal 
                                : this.endVal;
        
        this.countDown = this.startVal > end;
        
        var animateAmount = end - this.startVal;
        
        if (Math.abs(animateAmount) > this.options.smartEasingThreshold) {
            
            this.finalEndVal = end;
            
            var up = this.countDown
                                ?  1 
                                : -1;
                                
            this.endVal = end + (up * this.options.smartEasingAmount);
            
            this.duration = this.duration / 2;
            
        } else {
            
            this.endVal = end;
            this.finalEndVal = null;
            
        };
        
        if (this.finalEndVal) {
            
            this.easing = false;
            
        } else {
            
            this.easing = this.options.easing;
            
        };
        
    };
    
    // start animation
    start (callback) {
        
        if (this.error) return;
        
        this.callback = callback;
        
        if (this.duration > 0) {
            
            this.determineDirectionAndSmartEasing();
            this.paused = false;
            this.rAF = requestAnimationFrame(this.count);
            
        } else {
            
            this.printValue(this.endVal);
            
        }
    }
    // pause/resume animation
    pauseResume () {
        
        if (!this.paused) {
            
            cancelAnimationFrame(this.rAF);
            
        } else {
            
            this.startTime = null;
            this.duration = this.remaining;
            this.startVal = this.frameVal;
            
            this.determineDirectionAndSmartEasing();
            
            this.rAF = requestAnimationFrame(this.count);
            
        };
        
        this.paused = !this.paused;
    }
    // reset to startVal so animation can be run again
    reset () {
        
        cancelAnimationFrame(this.rAF);
        
        this.paused = true;
        this.resetDuration();
        this.startVal = this.validateValue(this.options.startVal);
        this.frameVal = this.startVal;
        this.printValue(this.startVal);
        
    };
    
    // pass a new endVal and start animation
    update (newEndVal) {
        
        cancelAnimationFrame(this.rAF);
        
        this.startTime = null;
        this.endVal = this.validateValue(newEndVal);
        
        if (this.endVal === this.frameVal) return;
        
        this.startVal = this.frameVal;
        
        if (!this.finalEndVal) this.resetDuration();
        
        this.determineDirectionAndSmartEasing();
        
        this.rAF = requestAnimationFrame(this.count);
        
    };
    
    printValue (val) {
        
        var result = this.formattingFn(val);
        if (this.el.tagName === 'INPUT') {
            var input = this.el;
            input.value = result;
        }
        else if (this.el.tagName === 'text' || this.el.tagName === 'tspan') {
            this.el.textContent = result;
        }
        else {
            this.el.innerHTML = result;
        }
    }
    
    ensureNumber (number) { return !Number.isNaN(number) };
    
    validateValue (value) {
        
        var newValue = Number(value);
        
        if (!this.ensureNumber(newValue)) {
            
            this.error = "[CountUp] invalid start or end value: " + value;
            
            return null;
            
        } else {
            
            return newValue;
        }
    };
    
    resetDuration () {
        
        this.startTime = null;
        
        this.duration = Number(this.options.duration) * 1000;
        
        this.remaining = this.duration;
        
    };

}