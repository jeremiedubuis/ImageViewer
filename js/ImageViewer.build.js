
var ImageViewer = (function() {

/**
  * @desc An equivalent to jQuery's extend, a mixin function that extends an object with another,
  * @param object1: object to be complemented
  * @param object2: object's properties will be applied to object1
*/
var extend = function() {
    for(var i=1; i<arguments.length; i++)
        for(var key in arguments[i])
            if(arguments[i].hasOwnProperty(key))
                arguments[0][key] = arguments[i][key];
    return arguments[0];
}

/**
  * @desc An equivalent to jquery's offset function that allows to get an element's offset to top left corner of document
  * @param  function, [DOM node]
*/
var offset = function (el) {

    var rect = el.getBoundingClientRect()

    return {
        top: rect.top + document.body.scrollTop,
        left: rect.left + document.body.scrollLeft
    };

};

/**
  * @desc An equivalent to jquery's proxy function that allows function creation with specified context and arguments
  * @param  function, [scope, [arguments]]
*/

var proxy = function(fn, context) {
    var args = [].slice.call(arguments, 2);

    return function() {
        return fn.apply(context || this, args.concat([].slice.call(arguments)));
    };
};

/**
  * @desc Creates a vertical or horizontal rangeslider from existing dom elements
  * @required  (helpers) : offset.js, proxy.js
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
            startSlide: proxy(this.startSlide, this),
            moveSlide:  proxy(this.moveSlide,  this),
            stopSlide:  proxy(this.stopSlide,  this)
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

var ImageViewer = function(url, options) {

    var _defaults = {
        minScale: 0.7,
        src: url,
        canvas: document.getElementsByTagName('canvas')[0],
        dragSmall: false, // allows dragging and dropping when image is smaller than canvas
        hasSlider: true,
        sliderOptions: {
            zoom: document.getElementsByClassName("zoom")[0],
            slider: document.getElementsByClassName("zoom")[0].getElementsByClassName("slider")[0]
        },
        onLoad: function(imageViewer) {},
        onScale: function(percents) {}
    };

    extend(this, extend(_defaults, options));
    this.init();

};

ImageViewer.prototype = {

    init: function() {

        this.img = new Image();
        this.c2d = this.canvas.getContext("2d");
        this.scale = this.minScale ;
        this.workspace = {
            width: this.canvas.parentNode.offsetWidth,
            height: this.canvas.parentNode.offsetHeight,
            ratio: this.canvas.parentNode.offsetWidth/this.canvas.parentNode.offsetHeight
        };
        this.offset = {
            x: 0,
            y: 0
        };

        this.load();
        this.addListeners();
    },

    addListeners: function() {
        this.fn= {
            onPointerDown : proxy(this.onPointerDown, this),
            onPointerMove : proxy(this.onPointerMove, this),
            onPointerUp   : proxy(this.onPointerUp, this),
            onPointerDown : proxy(this.onPointerDown, this)
        }
        this.canvas.addEventListener("mousedown", this.fn.onPointerDown, false);
        this.canvas.addEventListener("mousemove", this.fn.onPointerMove, false);
        document.addEventListener("mouseup", this.fn.onPointerUp, false);
        this.canvas.addEventListener("touchstart", this.fn.onPointerDown, false);
        this.canvas.addEventListener("touchmove", this.fn.onPointerMove, false);
        document.addEventListener("touchend", this.fn.onPointerUp, false);
    },

    load: function() {

        var _this = this;


        this.img.onload = function() { _this._onLoad(_this.img); };
        this.img.src = this.src;

    },

    _onLoad: function(img) {

        this.original = {
            width: img.width,
            height: img.height,
            src: img.src,
            ratio: img.width/img.height
        };

        this.setSize();

        if (this.scale < 1) {
            this.offset.x = (this.canvas.width - this.canvas.width*this.scale) *.5;
            this.offset.y = (this.canvas.height - this.canvas.height*this.scale) *.5;
        }

        this.draw();
        if (this.hasSlider) this.sliderInit();
        this.onLoad(this);
    },

    setSize: function() {

        var _oWidth  = this.original.width;
        var _oHeight = this.original.height;

        var _originalWider = _oWidth> this.workspace.width;
        var _originalTaller = _oHeight> this.workspace.height;
        var _landscape = _oWidth > _oHeight;

        var _width;
        var _height;

        if (!_originalWider && !_originalTaller) {

            _width = _oWidth;
            _height = _oHeight;

        } else {

            _width  = _originalWider  ? this.workspace.width  : _oWidth;
            _height = _originalTaller ? this.workspace.height : _oHeight;

            if (_width>_height) {
                _height = _width/this.original.ratio;
            } else {
                _width = _height*this.original.ratio;
            }

        }


        this.canvas.width = _width;
        this.canvas.height = _height;

    },

    draw: function() {
        this.c2d.drawImage(this.img,this.offset.x,this.offset.y, this.canvas.width*this.scale, this.canvas.height*this.scale);

    },

    darken: function(x,y,w,h) {

        this.c2d.save();
        this.c2d.globalAlpha=.50;
        this.c2d.fillStyle="black";
        this.c2d.fillRect(0,0,this.canvas.width,this.canvas.height);
        this.c2d.restore();
        this.c2d.save();
        this.c2d.beginPath();
        this.c2d.clearRect(x,y,w,h);
        this.c2d.rect(x,y,w,h);
        this.c2d.clip();
        this.c2d.drawImage(this.img,this.offset.x,this.offset.y,this.canvas.width*this.scale,this.canvas.height*this.scale);
        this.c2d.restore();

    },

    zoom: function(amount,x,y) {
        //img center vs workspace center
        this.scale = amount;
        this.setSize();
        this.offset.x = x || this.offset.x;
        this.offset.y = y || this.offset.y;
        this.c2d.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.clamp(this.offset.x,this.offset.y);
        this.draw();
    },

    clamp: function(x,y) {

        this.clampAxis("x", x);
        this.clampAxis("y", y)

    },

    clampAxis: function(axis, value) {

        value = value ? value : this.offset[axis];

        var _param = axis === "x" ? "width" : "height";
        var _delta = Math.abs(this.workspace[_param] - this.workspace[_param] * this.scale);

        if (this.scale > 1) {
            value = Math.max( -_delta , Math.min(value, 0) );
            this.offset[axis] = value;
        } else {
            if (this.dragSmall) {
                value = Math.max( 0 , Math.min(value, _delta) );
                this.offset[axis] = value;
            } else {
                this.offset.x = (this.canvas.width - this.canvas.width*this.scale) *.5;
                this.offset.y = (this.canvas.height - this.canvas.height*this.scale) *.5;
            }
        }


    },

    onPointerDown: function(e) {
        this.dragging = true;
        this.drag = {
            x: e.offsetX,
            y: e.offsetY
        };
    },

    onPointerMove: function(e) {
        if (this.dragging) {

            this.setSize();
            this.offset.x += e.offsetX - this.drag.x ;
            this.drag.x = e.offsetX;
            this.offset.y += e.offsetY - this.drag.y ;
            this.drag.y = e.offsetY;

            this.clamp();

            this.draw();
        }
    },

    onPointerUp: function(e) {
        if (this.dragging) {
            this.onPointerMove(e);
            this.dragging = false;
        }
    },

    sliderInit: function() {

        var _this = this;
        this.slider = new RangeSlider(this.sliderOptions.zoom, this.sliderOptions.slider);

        this.slider.onChange = function(percents) {

            _this.zoom(1/100*percents+ _this.minScale )
            _this.onScale(percents);
        };
    },

    destroy: function() {
            this.canvas.removeEventListener("mousedown", this.fn.onPointerDown, false);
            this.canvas.removeEventListener("mousemove", this.fn.onPointerMove, false);
            document.removeEventListener("mouseup", this.fn.onPointerUp, false);
            this.canvas.removeEventListener("touchstart", this.fn.onPointerDown, false);
            this.canvas.removeEventListener("touchmove", this.fn.onPointerMove, false);
            document.removeEventListener("touchend", this.fn.onPointerUp, false);
            if (this.slider) this.slider.destroy();
    }

};

return ImageViewer;
})();
