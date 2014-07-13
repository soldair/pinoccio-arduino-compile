
var build = require('../');

var stream = build(__dirname+'/Foostrap/Foostrap.ino',{firmware:'/home/soldair/Projects/pinoccio/firmware-pinoccio/',arduino:'/home/soldair/arduino_party/arduino-1.5.7/arduino'},function(err,data){

  console.log(arguments);

});


