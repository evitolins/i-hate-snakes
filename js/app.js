/*jslint
browser: true, devel: true, plusplus: true, unparam: true, todo: true, vars: true, white: true, nomen: true
*/
/*global RGBrefresher */
 
//
// Snake Experiment
// ============================================================================
// 
// Rules
// ----------------------------------------------------------------------------
// - continue in the same direction, until something obstructs the path
// - if an obstruction is found, try next direction clockwise
// - if no move is available, quit
// 

var refresh = new Refresher();
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var pixel = 30;

// Defaults
var tailMaxLength = 4;
var freq = 10;
var grid = [
  [0,0,3,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,2,0,0],
  [0,0,0,0,0,0,0,0,0,3],
  [0,0,0,0,0,0,0,0,2,3],
  [0,0,0,2,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,3,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,1]
];
var snaketail = [];

var dirs= [
  [0,-1], //n
  [1,0],  //e
  [0,1],  //s
  [-1,0]  //w
];

// Colors provided as rgba arrays (for easy manipulation)
var colorPalette = {
  0 : [0, 0, 0, 0],
  1 : [255, 0, 0, 1],
  2 : [0, 255, 0, 1],
  3 : [0, 0, 255, 1],
  4 : [255, 0, 255, 1]
};

var colorArrayToRGBA = function (rgba) {
  return 'rgba('+rgba[0]+','+rgba[1]+','+rgba[2]+','+rgba[3]+')';
};

var setCellValue = function (x, y, val) {
  grid[y][x] = val;
};

var getCellValue = function (x, y) {
  if (grid[y] === undefined) {
    return undefined;
  }
  if (grid[y][x] === undefined) {
    return undefined;
  }
  return grid[y][x];
};

// Validate Proposed X & Y coords
var getValidDirs = function (x, y){
  var xMax = grid[0].length;
  var yMax = grid.length;
  var dirs = [];
  // Validate N
  if (y-1 >= 0 && getCellValue(x, y-1) === 0) {
    dirs.push(0);
  }
  // Validate E
  if (x+1 < xMax && getCellValue(x+1,y) === 0) {
    dirs.push(1);
  }
  // Validate S
  if (y+1 < yMax && getCellValue(x,y+1) === 0) {
    dirs.push(2);
  }
  // Validate W
  if (x-1 >= 0 && getCellValue(x-1,y) === 0) {
    dirs.push(3);
  }
  return dirs;
};

//Canvas Renderer
var clear = function() {
  context.clearRect ( 0 , 0 , canvas.width , canvas.height );
};

var render = function (pixels) {
  var x,y,i,ii,rgba;
  clear();
  for (i=0; i<pixels.length; i++) {
    for (ii=0; ii<pixels[i].length; ii++) {
      x = ii * pixel;
      y = i * pixel;
      if (!pixels[i][ii]) {
        continue;
      }
      context.beginPath();
      if (pixels[i][ii] in colorPalette) {
        rgba = colorPalette[pixels[i][ii]];
        context.fillStyle = colorArrayToRGBA(rgba);
      }
      context.rect(x+1, y+1, pixel-2, pixel-2);
      context.fill();
    }
  }
};


var resetPosition = function (pos) {
  if (Object.prototype.toString.call( pos ) !== '[object Array]' ) return;
  //Reset given position
  grid[pos[1]][pos[0]] = 0;
};

// This example randomly chooses direction per choice
var snake_run = function (position, direction, random) {
  var pos = position;
  var dir = direction;
  var v,i;
  var tries = 10000;
  var lastdir = dir;
  
  var x = pos[0];
  var y = pos[1];
  var validDirs = getValidDirs(x, y);

  i = 0;
  var step = function () {
    x = pos[0];
    y = pos[1];
    validDirs = getValidDirs(x, y);
    
    // Quit
    if (!validDirs.length){
      return;
    }
    // Maintain course
    if (validDirs.indexOf(lastdir) >= 0 && !random) {
      dir = lastdir;
    }
    // Choose new direction
    else {
      dir = validDirs[Math.floor(Math.random() * validDirs.length)];
    }
    lastdir = dir;

    pos = [
      x + dirs[dir][0],
      y + dirs[dir][1]
    ];
    
    // Limit Tail Length
    snaketail.unshift(pos);
    if (snaketail.length > tailMaxLength) {
      resetPosition(snaketail.pop());
    }
    
    setCellValue(pos[0], pos[1], 4);
    
    render(grid);
    i++;
  };
  
  var next = function () {
    if(i <= tries && validDirs.length){
      step();
    } else {
      console.log("finished");
      refresh.stop();
    }
  };
  
  refresh.setFreq(freq);
  refresh.setCallback(next);
  refresh.start();
};


var init = function () {
  var randomX = Math.floor(Math.random() * 10);
  var randomY = Math.floor(Math.random() * 10);
  grid = 
    [
      [0,0,3,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,2,0,0],
      [0,0,0,0,0,0,0,0,0,3],
      [0,0,0,0,0,0,0,0,2,3],
      [0,0,0,2,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,3,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,1]
    ];
  snaketail = [];

  render(grid);
  snake_run([randomX,randomY], 0, false);
};


// Bind Button
var btn = document.getElementById('play');
btn.addEventListener('click', function(){refresh.start();});
var btn1 = document.getElementById('pause');
btn1.addEventListener('click', function(){refresh.reset();});
var btn2 = document.getElementById('reset');
btn2.addEventListener('click', function(){init();});

var input_tail = document.getElementById('tail');
input_tail.addEventListener('change', function(){tailMaxLength = parseInt(this.value, 10);clear();});
var input_freq = document.getElementById('freq');
input_freq.addEventListener('change', function(){freq = parseInt(this.value, 10);});

init();