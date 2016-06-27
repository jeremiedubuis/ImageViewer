/**
 * @desc Creates an image viewer that allows zooming and drag and drop
 * @required  (helpers) : extend.js
 */

/**
 * @param url {string} : the image source file
 * @param options {object}
 *      minScale  {int}                   minimum scale of canvas area for the image
 *      canvas    {node}                  canvas element that will hold the ImageViewer
 *      dragSmall {bool}                  allows dragging and dropping when image is smaller than canvas
 *      hasSlider {bool}                  whether the viewer has a zooming range slider
 *      onLoad    {function [instance] }  callback when image is loaded
 *      onScale   {function [percents] }  callback for every time the image scales
 *      sliderOptions {object}
 *          zoom   {node}                 element that will hold the the RangeSlider
 *          slider {node}                 element that will scale following zoom
 */


var ImageViewer = function(url, options) {

    var _defaults = {
        minScale: 0.7,
        maxScale: 1.5,
        src: url,
        canvas: document.getElementsByTagName('canvas')[0],
        dragSmall: false,
        hasSlider: true,
        easing: 'easeOutCubic',
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
            onPointerDown : this.onPointerDown.bind(this),
            onPointerMove : this.onPointerMove.bind(this),
            onPointerUp   : this.onPointerUp.bind(this),
            onPointerDown : this.onPointerDown.bind(this)
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
        this.percentageOfOriginal = (this.workspace.width * this.scale) / this.original.width * 100;

    },

    setCenter: function() {
        this.setCenterAxis('x');
        this.setCenterAxis('y');
    },

    setCenterAxis: function(axis) {
        var _param = axis === "x" ? "width" : "height";

        var workspaceCenter =  this.workspace[_param] * 0.5;

        var offsetCenter = this.offset[axis] - workspaceCenter;
        var offsetRatio =  offsetCenter / (this.workspace[_param] * this.prevScale / 2);

        this.offset[axis] =  (this.workspace[_param] * this.scale) * offsetRatio / 2 + workspaceCenter;
    },

    draw: function() {
        this.c2d.drawImage(this.img,this.offset.x,this.offset.y, this.canvas.width*this.scale, this.canvas.height*this.scale);
        var _this = this;
        this.applyFilterHistory();

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
        this.prevScale = this.scale;
        this.scale = amount;
        if (this.prevScale !== this.scale || x !== this.offset.x || y !== this.offset.y) {
            this.setSize();
            this.setCenter();
            this.offset.x = typeof x !== 'undefined' ? x : this.offset.x;
            this.offset.y = typeof y !== 'undefined' ? y : this.offset.y;
            this.c2d.clearRect(0,0,this.canvas.width,this.canvas.height);
            this.clamp(this.offset.x,this.offset.y);
            this.draw();
        }
    },

    animationFrameRate: 20,
    animationTimePerPixel: 4, // ms per pixel
    animateZoom: function(amount, x, y) {

        this.prevTime = new Date().getTime();
        x = this.clampAxis("x", x);
        y = this.clampAxis("y", y);

        this.easingFunction = this.easingFunctions[this.easing];


        var xDistance =  x - this.offset.x;
        var yDistance = y - this.offset.y;

        var xTime = Math.abs(xDistance) * this.animationTimePerPixel;
        var yTime = Math.abs(yDistance) * this.animationTimePerPixel;
        var time = xTime >yTime ? xTime : yTime;

        var totalIterations = Math.ceil( time / this.animationFrameRate );

        window.requestAnimationFrame(
            this.animateFrame.bind( this, this.offset.x, this.offset.y, x, y, xDistance, yDistance,  0, totalIterations )
        );
    },

    animateFrame: function( startX, startY, x, y, xDistance, yDistance, iteration, totalIterations ) {

        var time = new Date().getTime();

        if (time>= this.prevTime+this.animationFrameRate) {

            var destX = Math.round( this.easingFunction(iteration, startX, xDistance, totalIterations) );
            var destY = Math.round( this.easingFunction(iteration, startY, yDistance, totalIterations) );
            this.zoom(this.scale, destX, destY );
            this.prevTime = time;
            iteration++;
        }

        if (iteration < totalIterations)
            window.requestAnimationFrame(this.animateFrame.bind(this,startX, startY, x, y,  xDistance, yDistance, iteration, totalIterations) );
    },

    clamp: function(x,y) {
        this.offset.x = this.clampAxis("x", x);
        this.offset.y = this.clampAxis("y", y);

    },

    clampAxis: function(axis, value) {

        value = typeof value !== 'undefined' ? value : this.offset[axis];
        var _param = axis === "x" ? "width" : "height";

        var _imgSize = this.canvas[_param] * this.scale;
        var _workSpaceSize = this.workspace[_param];
        var _maxAxisValue = _imgSize < _workSpaceSize ?  _workSpaceSize - _imgSize : 0;
        var _minAxisValue =  _imgSize < _workSpaceSize ?  0 : _workSpaceSize - _imgSize;
        return Math.min( _maxAxisValue, Math.max( value, _minAxisValue ) );

    },

    onPointerDown: function(e) {
        this.dragging = true;
        this.drag = {
            x: e.pageX,
            y: e.pageY
        };
    },

    onPointerMove: function(e) {
        if (this.dragging) {

            this.setSize();
            this.offset.x += e.pageX - this.drag.x ;
            this.drag.x = e.pageX;
            this.offset.y += e.pageY - this.drag.y ;
            this.drag.y = e.pageY;

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

            var _range = _this.maxScale - _this.minScale;
            _this.zoom( _range / 100 * percents + _this.minScale );
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
    },

    getImageLink: function(quality) {
        return this.canvas.toDataURL('image/jpeg', quality || .7);
    },

    applyFilter: function(filter, filterArguments, noHistory) {

        if (!filterArguments.length) filterArguments = [filterArguments];

        var imageData = this.c2d.getImageData(0,0, this.canvas.width,this.canvas.height);
        var historyEntry = {
            filter: filter,
            arguments: filterArguments
        };
        if (!filterArguments) filterArguments = [];
        filterArguments.unshift(imageData);

        if (this.filters[filter])
            var _newData = this.filters[filter].apply(this.filters, filterArguments);
        else
            throw new Error('ImageViewer -> Filter doesn\'t exist');

        if (!noHistory) this.filters.history.push(historyEntry);
        this.c2d.putImageData(_newData,0,0);

    },

    resetFilters: function() {
        if (this.filters.dataHistory.length)
            this.c2d.putImageData(this.filters.dataHistory[0],0,0);
    },

    applyFilterHistory: function() {
        var _this = this;
        this.filters.history.forEach(function(entry) {
            _this.applyFilter(entry.filter, entry.arguments, true);
        });
    },

    filters: {

        history: [],

        grayscale: function(imageData) {
            var data = imageData.data;
            for (var i=0; i<data.length; i+=4) {
                var r = data[i];
                var g = data[i+1];
                var b = data[i+2];
                // CIE luminance for the RGB
                // The human eye is bad at seeing red and blue, so we de-emphasize them.
                var v = 0.2126*r + 0.7152*g + 0.0722*b;
                data[i] = data[i+1] = data[i+2] = v;
            }
            return imageData;
        },

        rgb: function(imageData, color, modifier) {

            var colors = {
                red: 0,
                green: 1,
                blue: 2
            };

            for (var i=0; i<imageData.data.length; i+=4) {
                imageData.data[ i + colors[color] ] = imageData.data[ i + colors[color] ]+modifier;
            }

            return imageData;
        },

        brightness: function(imageData, modifier) {
            var d = imageData.data;
            for (var i=0; i<d.length; i+=4) {
                d[i] += modifier;
                d[i+1] += modifier;
                d[i+2] += modifier;
            }
            return imageData;
        }

    },

    easingFunctions: {
        linearTween: function (currentIteration, startValue, changeInValue, totalIterations) {
            return changeInValue*currentIteration/totalIterations + startValue;
        },
        easeOutCubic: function (t, b, c, d) {
            t /= d;
            t--;
            return c*(t*t*t + 1) + b;
        },
        easeInQuad: function (currentIteration, startValue, changeInValue, totalIterations) {
            currentIteration /= totalIterations;
            return changeInValue*currentIteration*currentIteration + startValue;
        },
        easeOutQuad: function (t, b, c, d) {
            t /= d;
            return -c * t*(t-2) + b;
        },
        easInOutQuad: function (t, b, c, d) {
            t /= d/2;
            if (t < 1) return c/2*t*t + b;
            t--;
            return -c/2 * (t*(t-2) - 1) + b;
        },
        easeInCubic: function (t, b, c, d) {
            t /= d;
            return c*t*t*t + b;
        },
        easeInOutCubic: function (t, b, c, d) {
            t /= d/2;
            if (t < 1) return c/2*t*t*t + b;
            t -= 2;
            return c/2*(t*t*t + 2) + b;
        },
        easeInQuart: function (t, b, c, d) {
            t /= d;
            return c*t*t*t*t + b;
        },
        easeOutQuart: function (t, b, c, d) {
            t /= d;
            t--;
            return -c * (t*t*t*t - 1) + b;
        },
        easeInOutQuart: function (t, b, c, d) {
            t /= d/2;
            if (t < 1) return c/2*t*t*t*t + b;
            t -= 2;
            return -c/2 * (t*t*t*t - 2) + b;
        },
        easeInQuint: function (t, b, c, d) {
            t /= d;
            return c*t*t*t*t*t + b;
        },
        easeOutQuint: function (t, b, c, d) {
            t /= d;
            t--;
            return c*(t*t*t*t*t + 1) + b;
        },
        easeInOutQuint: function (t, b, c, d) {
            t /= d/2;
            if (t < 1) return c/2*t*t*t*t*t + b;
            t -= 2;
            return c/2*(t*t*t*t*t + 2) + b;
        },
        easeInSine: function (t, b, c, d) {
            return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
        },
        easeOutSine: function (t, b, c, d) {
            return c * Math.sin(t/d * (Math.PI/2)) + b;
        },
        easeInOutSine: function (t, b, c, d) {
            return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
        },
        easeInExpo: function (t, b, c, d) {
            return c * Math.pow( 2, 10 * (t/d - 1) ) + b;
        },
        easeOutExpo: function (t, b, c, d) {
            return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
        },
        easeInOutExpo: function (t, b, c, d) {
            t /= d/2;
            if (t < 1) return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
            t--;
            return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
        },
        easeInCirc: function (t, b, c, d) {
            t /= d;
            return -c * (Math.sqrt(1 - t*t) - 1) + b;
        },
        easeOutCirc: function (t, b, c, d) {
            t /= d;
            t--;
            return c * Math.sqrt(1 - t*t) + b;
        },
        easeInOutCirc: function (t, b, c, d) {
            t /= d/2;
            if (t < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
            t -= 2;
            return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
        }

    }


};
