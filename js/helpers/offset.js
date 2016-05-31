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
