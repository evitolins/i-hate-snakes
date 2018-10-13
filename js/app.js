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

// Defaults
var pixel = 30;
var tailMaxLength = 4;
var freq = 1;
var width = 10;
var height = 10;
var grid = new Grid2D(width, height, 0);
var snake = new Snake();


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

// Vectors stored separately to easily check if they are valid choices
var vectorTable = [
  [0,-1], //n
  [1,-1], //ne
  [1,0],  //e
  [1,1],  //se
  [0,1],  //s
  [-1,1], //sw
  [-1,0], //w
  [-1,-1] //nw
];

// Validate Proposed X & Y coords
var getValidVectors = function (x, y, grid){
  var xMax = width;
  var yMax = height;
  var vectors = [];

  var vx, vy, i;
  for (i=0; i<vectorTable.length; i++) {
    vx = x + vectorTable[i][0];
    vy = y + vectorTable[i][1];
    if (vx < 0 || vx >= xMax) {
      continue;
    }
    if (vy < 0 || vy >= yMax) {
      continue;
    }
    if (grid[vy][vx] !== 0) {
      continue;
    }
    vectors.push(vectorTable[i]);
  }
  return vectors;
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

var canvasSize = function () {
  canvas.width = pixel * width;
  canvas.height = pixel * height;
};


var renderSnake = function (snakeArray) {
  var i, x, y, rgba;
  rgba = colorPalette[4];

  x = (snakeArray[0][0] * pixel) + 1 + pixel/2;
  y = (snakeArray[0][1] * pixel) + 1 + pixel/2;

  context.beginPath();
  context.moveTo(x,y);
  for (i = 1; i < snakeArray.length; i++) {
    x = (snakeArray[i][0] * pixel) + 1 + pixel/2;
    y = (snakeArray[i][1] * pixel) + 1 + pixel/2;
    context.lineTo(x,y);
  }
  context.lineWidth = pixel - 2;
  context.strokeStyle = colorArrayToRGBA(rgba);
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.stroke();
};


// This example randomly chooses direction per choice
var snake_run = function (vector, random) {
  var v = vector;
  var tries = 10000;
  var lv = v;
  var v, i, pos, x, y, validDirs;
  var selfCollide = false;

  var collisionGridFunc = (selfCollide) ? gridCombined : grid.getGrid;

  x = snake.getSnake()[0][0];
  y = snake.getSnake()[0][1];
  validDirs = getValidVectors(x, y, collisionGridFunc());

  i = 0;
  var step = function () {
    x = snake.getSnake()[0][0];
    y = snake.getSnake()[0][1];
    validDirs = getValidVectors(x, y, collisionGridFunc());

    // Quit
    if (!validDirs.length){
      return;
    }
    // Maintain course
    if (validDirs.indexOf(lv) > -1 && !random) {
      v = lv;
    }
    // Choose new direction
    else {
      v = validDirs[Math.floor(Math.random() * validDirs.length)];
    }
    lv = v;

    // Limit Tail Length
    snake.move(v[0], v[1]);
    clear();
    render(grid.getGrid());
    renderSnake(snake.getSnake());
    i++;
  };
  
  var next = function () {
    if(i <= tries && validDirs.length){
      step();
    } else {
      refresh.stop();
      console.log("finished");
    }
  };
  
  refresh.setFreq(freq);
  refresh.setCallback(next);
  refresh.start();
};


var init = function () {
  var vector = vectorTable[Math.floor(Math.random() * 3)];
  var randomX = Math.floor(Math.random() * 10);
  var randomY = Math.floor(Math.random() * 10);

  canvasSize();

  grid.setGrid([
      [2,0,0,3,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0],
      [0,0,0,1,0,0,0,2,0,0],
      [0,0,0,0,0,0,0,0,0,3],
      [0,0,0,0,0,0,0,0,2,3],
      [0,0,0,2,0,0,0,0,0,0],
      [0,1,0,0,0,0,0,0,0,0],
      [0,0,0,0,3,0,0,0,0,0],
      [1,0,0,0,0,0,0,0,1,0],
      [1,0,0,0,0,0,0,0,0,0]
    ]);
  snake.init(randomX, randomY, tailMaxLength);
  clear();
  render(grid.getGrid());
  renderSnake(snake.getSnake());
  snake_run(vector, false);
};

var ui = {
  btn_play : document.getElementById('play'),
  btn_pause : document.getElementById('pause'),
  btn_reset : document.getElementById('reset'),
  range_tail : document.getElementById('tail'),
  range_freq : document.getElementById('freq'),
  range_pixel : document.getElementById('pixel')
};

var listeners = {
  play : function () {
    refresh.start();
  },
  pause : function () {
    refresh.reset();
  },
  reset : function(){
    init();
  },
  setMaxLength : function () {
    var val = parseInt(this.value, 10);
    tailMaxLength = val;
    snake.setMaxLength(val);
  },
  setFreq : function () {
    var val = parseInt(this.value, 10);
    freq = val;
    refresh.setFreq(val);
  },
  setPixel : function () {
    var val = parseInt(this.value, 10);
    pixel = val;
    canvasSize();
    clear();
    render(grid.getGrid());
    renderSnake(snake.getSnake());
  }
};

// Bind UI
ui.btn_play.addEventListener('click', listeners.play);
ui.btn_pause.addEventListener('click', listeners.pause);
ui.btn_reset.addEventListener('click', listeners.reset);
ui.range_tail.addEventListener('change', listeners.setMaxLength);
ui.range_tail.addEventListener('input', listeners.setMaxLength);
ui.range_freq.addEventListener('change', listeners.setFreq);
ui.range_freq.addEventListener('input', listeners.setFreq);

ui.range_pixel.addEventListener('change', listeners.setPixel);
ui.range_pixel.addEventListener('input', listeners.setPixel);

init();

});