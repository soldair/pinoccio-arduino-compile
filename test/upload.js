

var build = require('../');

var s = build.upload("/home/soldair/Downloads/Bootstrap.hex",{
  avrdude:"/home/soldair/arduino_party/arduino-1.5.7/hardware/tools/avr/bin/avrdude",
  config:"/home/soldair/arduino_party/arduino-1.5.7/hardware/tools/avr/etc/avrdude.conf",
  port:"/dev/ttyACM0",
  verbose:true
},function(err,data){

  console.log(err,data);

});

s.pipe(process.stdout);

