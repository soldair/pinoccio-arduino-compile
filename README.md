pinoccio-arduino-compile
========================

node module for compiling sketches for pinccio using the arduino ide from the command line

you can use this to just generate a hex file to flash later or build and upload a hex file immediatly

```js
var build = require('pinoccio-arduino-compile');

var output = build("path to ino",{
  arduino:"path to arduino executable",
  firmware:"path to checkout of https://github.com/pinoccio/firmware-pinoccio",
},function(err,data){

  console.log(err);

  /*
    data is an object with
    {
      id:the build directory name. reuse this value for incremental recompile,
      hex: the path to the generated hex file
    }
  */
  

});


```


options
-------- 
  - firmware
    - required the path to firware-pinoccio
  - arduino
    - the path to your arduino executable defaults to "arduino"
  - dir
    - the build directory defaults to process.cwd()
  - upload
    - optional if provided and its the path to a serial device the hex will be flashed
  - verbose
    - if verboise is set the upload process dumps all of the send recv data from avrdude
  - id
    - optional if used the bui8ld dir will have this name. if build dir exists it will be resused for quicker compile.
  - display
    - arduino requires that there be a valid X display available. ":0" is the default but if you are running on the server you will have to use Xvfb. require('./xvfb') to create a virtual display.

arduino docs
------------
https://github.com/arduino/Arduino/blob/ide-1.5.x/build/shared/manpage.adoc
