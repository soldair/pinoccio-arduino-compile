var cp = require('child_process');

// creates a hex file ready to flash on pinoccio scouts.

var fs = require('fs');
var path = require('path');

var Xvfb = require('./xvfb');

module.exports = function(ino,options,cb){
  firmwareDir = options.firmware;
  arduino = options.arduino||'arduino';

  if(!firmwareDir) {
    return setImmediate(function(){
      cb(new Error('firmware option required'));
    });
  }


  var buildsh = __dirname+"/build.sh"
  var id = Date.now();
  var build = options.buildDir||process.cwd();
  var buildDir = path.join(build,''+id);
  var inoName = path.basename(ino);

  var xvfb = Xvfb(14);// todo list active displays choose next display.

  var done = false;  

  xvfb.on('exit',function(code){
    if(!done) console.log("xvfb terminated early!",code)
  })

  var display = 14;


  var containedWith = path.basename(path.dirname(ino));

  if(containedWith != inoName.split('.')[0]) {
    return setImmediate(function(){
      cb(new Error('your ino must be contained by a folder of the same name because... arduino. mkdir '+path.join(path.dirname(ino),inoName.split('.')[0])+'; mv '+ino+' '+path.join(path.dirname(ino),inoName.split('.')[0],inoName)));
    });
  }


  fs.mkdir(buildDir,function(err){
    if(err) return cb(err);


    var inoPath = ino;
    console.log(inoPath);
    console.log('setting cwd to ',buildDir);

    cp.execFile(buildsh,['-v'],{cwd:buildDir,env:{FIRMWARE:firmwareDir,ARDUINO:arduino,SKETCH:inoPath,DISPLAY:':0'}},function(err,stdout,stderr){
      done = true;

      console.log('done!');

      xvfb.kill();


      cb(err,stdout,stderr);

    });

  });
  // make build dir
  // copy sketch to build dir
  
}

function copyino(){

}




