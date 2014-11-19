var cp = require('child_process');
var through = require('through');

// creates a hex file ready to flash on pinoccio scouts.

var fs = require('fs');
var path = require('path');

var Xvfb = require('./xvfb');

module.exports = function(ino,options,cb){
  var firmwareDir = options.firmware;
  var arduino = options.arduino||'arduino';
  var display = options.display;

  if(!firmwareDir) {
    return setImmediate(function(){
      cb(new Error('firmware option required'));
    });
  }

  if(!display) {
    display = ':0';
  }


  var buildsh = __dirname+"/build.sh"
  var id = Date.now();
  var build = options.dir||process.cwd();
  var buildDir = path.join(build,''+id);
  var inoName = path.basename(ino);
  
  var stream = through();

  var containedWith = path.basename(path.dirname(ino));

  if(containedWith != inoName.split('.')[0]) {
    return setImmediate(function(){
      cb(new Error('your ino must be contained by a folder of the same name because... arduino. mkdir '+path.join(path.dirname(ino),inoName.split('.')[0])+'; mv '+ino+' '+path.join(path.dirname(ino),inoName.split('.')[0],inoName)));
    });
  }

  fs.mkdir(buildDir,function(err){
    if(err && e.code != "EEXIST") return cb(err);

    var inoPath = ino;
    stream.write("compiling ino "+inoPath+"\n");
    stream.write('setting cwd to '+buildDir+"\n");

    var env = {FIRMWARE:firmwareDir,ARDUINO:arduino,SKETCH:inoPath,DISPLAY:display};

    var args = [];
    if(options.verbose) {
      args.push('-v');// this dumps the all of send recv data from avrdude on upload.
    }

    if(options.upload){
      args.push('--upload');
      env.PORT = options.port||options.upload;
    }

    stream.write("build args \""+args.join(' ')+'"\n');

    var proc = cp.execFile(buildsh,args,{cwd:buildDir,env:env});

    var timer;

    proc.on('exit',function(err){

      clearTimeout(timer);
      
      stream.end();

      var hexPath = path.join(buildDir,containedWith+'.hex');
  
      fs.exists(hexPath,function(exists){
        cb(err,{id:id,hex:exists?hexPath:false});
      });

    });

    proc.stdout.pipe(stream);
    proc.stderr.pipe(stream);

    timer = setTimeout(function(){
      stream.write("[ERROR] compile process took too long! force killing.\n");
      proc.kill("SIGTERM");
    },40000+(options.upload?30000:0));

  });

  return stream;
}

// already have a hex? upload it!
// 
module.exports.upload = function(hex,options,cb){
  var avrdude = options.avrdude||'avrdude';
  var config = options.config;
  var port = options.port;
  var verify = options.verify;
  var verbose = options.verbose;
  var noTimeout = options.noTimeout;
  var noBuffer = options.noBuffer;
  // /home/soldair/arduino_party/arduino-1.5.7/hardware/tools/avr/bin/avrdude -C/home/soldair/arduino_party/arduino-1.5.7/hardware/tools/avr/etc/avrdude.conf -q -q -patmega256rfr2 -cwiring -P/dev/ttyACM0 -b115200 -D -Uflash:w:/home/soldair/test/Bootstrap.hex

  var timer;

  if(!port) {
    return process.nextTick(function(){
      cb("no serial port specified pass option \"port\"")
    })
  }

  var args =  ["-patmega256rfr2", "-cwiring", "-P"+port, "-b115200", "-D"];

  if(config) args.push("-C"+config);
  if(!verify) args.push("-V");
  if(verbose) args.push("-v","-v");
  else args.push("-q","-q");

  args.push("-Uflash:w:"+hex);

  var stream = through();

  console.log(avrdude,args);

  var proc = cp.spawn(avrdude,args);

  proc.on('exit',function(code){
    clearTimeout(timer);  
    stream.end();
    
    cb(code,output);
 
  });

  var output = false;
  if(!noBuffer){
    output = "";
    stream.on('data',function(data){
      output += data;
    })
  }

  proc.stdout.pipe(stream);
  proc.stderr.pipe(stream);

  if(!noTimeout){
    timer = setTimeout(function(){
      stream.write("[ERROR] upload process took too long! force killing.\n");
      proc.kill("SIGTERM");
    },70000);

    timer.unref();
  }

  stream.proc = proc;

  return stream;
 
}



