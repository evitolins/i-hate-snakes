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

require.config({
  paths: {
      "underscore": "../bower_components/underscore/underscore",
      "refresher" : "../bower_components/refresher.js/refresher"
  }
});

require(["refresher", "underscore", "Grid2D", "Snake"], function(Refresher, _, Grid2D, Snake) {
'use strict';
var refresh = new Refresher();
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var pixel = 30;

// Defaults
var tailMaxLength = 4;
var freq = 1;
var width = 10;
var height = 10;
var grid = new Grid2D(width, height, 0);
var snake = new Snake();

var dirs = [
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

// Combines grid and snake to evaluate collisions
var gridCombined = function () {
  var gridCopy = _.map(grid.getGrid(), _.clone);
  var snakeVals = snake.getSnake();
  var pos, i;
  for (i=0; i<snakeVals.length; i++) {
    pos = snakeVals[i];
    gridCopy[pos[1]][pos[0]] = 4;
  }
  return gridCopy;
};

// Validate Proposed X & Y coords
var getValidDirs = function (x, y){
  var xMax = width;
  var yMax = height;
  var dirs = [];
  var gridC = gridCombined();

  // Validate N
  if (y-1 >= 0 && gridC[y-1][x] === 0) {
    dirs.push(0);
  }
  // Validate E
  if (x+1 < xMax && gridC[y][x+1] === 0) {
    dirs.push(1);
  }
  // Validate S
  if (y+1 < yMax && gridC[y+1][x] === 0) {
    dirs.push(2);
  }
  // Validate W
  if (x-1 >= 0 && gridC[y][x-1] === 0) {
    dirs.push(3);
  }

  return dirs;
};

//Canvas Renderer
var clear = function () {
  context.clearRect ( 0 , 0 , canvas.width , canvas.height );
};

var render = function (pixels) {
  var x,y,i,ii,rgba;
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


// This example randomly chooses direction per choice
var snake_run = function (direction, random) {
  var dir = direction;
  var tries = 10000;
  var lastdir = dir;
  var v, i, pos, x, y, validDirs;  

  x = snake.getSnake()[0][0];
  y = snake.getSnake()[0][1];
  validDirs = getValidDirs(x, y);

  i = 0;
  var step = function () {
    x = snake.getSnake()[0][0];
    y = snake.getSnake()[0][1];
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

    // Limit Tail Length
    snake.move(dirs[dir][0], dirs[dir][1]);
    clear();
    render(gridCombined());
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
  var dir = Math.floor(Math.random() * 3);
  var randomX = Math.floor(Math.random() * 10);
  var randomY = Math.floor(Math.random() * 10);
  grid.setGrid([
      [4,0,0,3,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,1,0,0,0,2,0,0],
      [0,0,0,0,0,0,0,0,0,3],
      [0,0,0,0,0,0,0,0,2,3],
      [0,0,0,2,0,0,0,0,0,0],
      [0,1,0,0,0,0,0,0,0,0],
      [0,0,0,0,3,0,0,0,0,0],
      [1,0,0,0,0,0,0,0,0,0],
      [1,0,0,0,0,0,0,0,0,1]
    ]);
  snake.init(randomX, randomY, tailMaxLength);
  clear();
  render(gridCombined());
  snake_run(dir, false);
};

var setMaxLength = function (val) {
  tailMaxLength = val;
  snake.setMaxLength(val);
};
var setFreq = function (val) {
  freq = val;
  refresh.setFreq(val);
};



// Bind Button
var btn = document.getElementById('play');
btn.addEventListener('click', function(){refresh.start();});
var btn1 = document.getElementById('pause');
btn1.addEventListener('click', function(){refresh.reset();});
var btn2 = document.getElementById('reset');
btn2.addEventListener('click', function(){init();});

var input_tail = document.getElementById('tail');
input_tail.addEventListener('change', function(){setMaxLength(parseInt(this.value, 10));});
var input_freq = document.getElementById('freq');
input_freq.addEventListener('change', function(){setFreq(parseInt(this.value, 10));});

init();

});