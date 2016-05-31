/**
  * @desc Creates a vertical or horizontal rangeslider from existing dom elements
  * @required  (helpers) : offset.js
*/

/**
  * @param container (DOM element) : the container that will contain everything
  * @param bar (DOM element) : the bar that will grow as range changes
  * @param head (DOM element) : range head cursor
  * @param vertical (bool) : defaults to false
*/


var RangeSlider = function(container, bar, vertical){

    this.container = container;
    this.bar = bar;
    this.vertical = vertical || false;
    this.init();

};

RangeSlider.prototype = {

    init: function () {

        this.fn = {
            startSlide: this.startSlide.bind(this),
            moveSlide:  this.moveSlide.bind(this),
            stopSlide:  this.stopSlide.bind(this)
        };

        this.percent = 0;

        this.setSize();

        this.container.addEventListener('mousedown', this.fn.startSlide, false);
        document.addEventListener('mousemove', this.fn.moveSlide, false);
        document.addEventListener('mouseup', this.fn.stopSlide, false);

    },

    setSize: function() {

            var _prevStyle = this.container.style.display;
            var _prevStyleParent = this.container.parentNode.style.display;

            this.container.style.display = "block";
            this.container.parentNode.style.display = "block";

            if (this.vertical) {
                this.max = this.container.offsetHeight;
                this.bar.style.maxHeight = this.max+"px";
                this.emptyOffset = offset(this.container).top+this.max;
            } else {
                this.max = this.container.offsetWidth;
                this.bar.style.maxWidth = this.max+"px";
                this.emptyOffset = offset(this.container).left;
            }

            this.percentSize = this.max/100;

            this.container.style.display = _prevStyle;
            this.container.parentNode.style.display = _prevStyleParent;
    },

    startSlide: function(e){

        this.sliding = true;
        this.set(e);

   },

   moveSlide: function(e){
       if( this.sliding )  this.set(e);
   },

   offsetToPercent: function(_offset) {
       var _percent=( _offset - this.emptyOffset) / this.percentSize;
        if (this.vertical) return _percent<=0 ? Math.abs(_percent) : 0;
        else return _percent>=0 ? _percent : 0;
   },

   set: function(e) {
        this.percent= this.offsetToPercent(this.vertical ? e.pageY : e.pageX);
        this.bar.style[this.vertical ? "height" : "width"] = this.percent + '%';
        this.onChange(Math.min(100,Math.max(0,this.percent)) );

   },

   stopSlide: function(e){
       this.sliding = false;
   },

   value: function(value, trigger){

        if (typeof value === "undefined")  return this.percent;

        this.percent = value;
        this.bar.style[this.vertical ? "height" : "width"] = this.percent + '%';

        if (typeof trigger === "undefined" || trigger) this.onChange(this.percent);

        return this;

    },

    onChange: function() {

    },

    destroy: function() {

        document.removeEventListener('mousemove', this.fn.moveSlide, false);
        document.removeEventListener('mouseup', this.fn.stopSlide, false);
        this.container.removeEventListener('mousedown', this.fn.startSlide);
    }

};
