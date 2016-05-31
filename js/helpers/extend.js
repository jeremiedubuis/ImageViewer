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
