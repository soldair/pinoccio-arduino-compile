var cp = require('child_process');

module.exports = function(display){
  return cp.exec("Xvfb :"+(+display)+" -screen 0 1024x768x24");
}


