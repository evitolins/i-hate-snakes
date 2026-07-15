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

require(["refresher", "underscore", "Grid2D_prototype", "Snake"], function(Refresher, _, Grid2D, Snake) {
'use strict';
var refresh = new Refresher();
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

// Defaults
var pixel = 36;
var tailMaxLength = 20;
var freq = 1;
var width = 15;
var height = 15;
var grid = new Grid2D(width, height, 0);
var snake = new Snake();
var isRandom = true;
var isSelfCollide = false;

// Colors provided as rgba arrays (for easy manipulation)
var colorPalettes = [
  {
    0 : [0, 0, 0, 0],
    1 : [255, 0, 0, 1],
    2 : [0, 255, 0, 1],
    3 : [0, 0, 255, 1],
    4 : [220, 220, 220, 0.4],
    5 : [255, 255, 255, 1]
  },
  {
    0 : [0, 0, 0, 0],
    1 : [255, 255, 255, 1],
    2 : [200, 200, 200, 1],
    3 : [100, 100, 100, 1],
    4 : [70, 70, 70, 1],
    5 : [40, 40, 40, 1]
  },
  {
    0 : [0, 0, 0, 0],
    1 : [40, 40, 40, 1],
    2 : [70, 70, 70, 1],
    3 : [100, 100, 100, 1],
    4 : [200, 200, 200, 1],
    5 : [255, 255, 255, 1]
  }
];

var colorPalette = colorPalettes[2];


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
      // context.rect(x+1, y+1, pixel-2, pixel-2);
      context.arc(x+(pixel/2), y+(pixel/2), (pixel/4), 0, 2 * Math.PI, false);
      context.fill();
    }
  }
};

var canvasSize = function () {
  canvas.width = pixel * width;
  canvas.height = pixel * height;
};


var renderSnake = function (snakeArray) {
  var i, x, y, rgba_shadow, rgba_main;
  rgba_shadow = colorPalette[5]; rgba_shadow[3] = 0.2;
  rgba_main = colorPalette[0]; rgba_main[3] = 0.8;

  // Shadow Line
  x = (snakeArray[0][0] * pixel) + 1 + pixel/2;
  y = (snakeArray[0][1] * pixel) + 1 + pixel/2;
  context.beginPath();
  context.moveTo(x,y);
  for (i = 1; i < snakeArray.length; i++) {
    x = (snakeArray[i][0] * pixel) + 1 + pixel/2;
    y = (snakeArray[i][1] * pixel) + 1 + pixel/2;
    context.lineTo(x,y);
  }
  context.lineWidth = pixel*2;
  context.strokeStyle = colorArrayToRGBA(rgba_shadow);
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.stroke();

  // Main Line
  x = (snakeArray[0][0] * pixel) + 1 + pixel/2;
  y = (snakeArray[0][1] * pixel) + 1 + pixel/2;
  context.beginPath();
  context.moveTo(x,y);
  for (i = 1; i < snakeArray.length; i++) {
    x = (snakeArray[i][0] * pixel) + 1 + pixel/2;
    y = (snakeArray[i][1] * pixel) + 1 + pixel/2;
    context.lineTo(x,y);
  }
  context.lineWidth = pixel;
  context.strokeStyle = colorArrayToRGBA(rgba_main);
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.stroke();

  // Head
  x = (snakeArray[0][0] * pixel) + 1 - pixel/2;
  y = (snakeArray[0][1] * pixel) + 1 - pixel/2;
  context.beginPath();
  context.fillStyle = "#ff0000aa";
  context.arc(x+(pixel), y+(pixel), (pixel/2), 0, 2 * Math.PI, false);
  context.fill();
};

var reflect_vector = function (vector, validDirs) {

  // Unblocked path
  if (validDirs.indexOf(vector) > -1) {
    return vector;
  }

  // On Axis 
  if (vector[0] === 0 && vector[1] === 1) {
    if (validDirs.indexOf([1,0]) > -1) { return [1,0]; }
    if (validDirs.indexOf([-1,0]) > -1) { return [-1,0]; }
    if (validDirs.indexOf([1,-1]) > -1) { return [1,-1]; }
    if (validDirs.indexOf([-1,-1]) > -1) { return [-1,-1]; }
  }
  if (vector[0] === 0 && vector[1] === -1) {
    if (validDirs.indexOf([1,0]) > -1) { return [1,0]; }
    if (validDirs.indexOf([-1,0]) > -1) { return [-1,0]; }
    if (validDirs.indexOf([1,1]) > -1) { return [1,1]; }
    if (validDirs.indexOf([-1,1]) > -1) { return [-1,1]; }
  }
  if (vector[0] === 1 && vector[1] === 0) {
    if (validDirs.indexOf([0,1]) > -1) { return [0,1]; }
    if (validDirs.indexOf([0,-1]) > -1) { return [0,-1]; }
    if (validDirs.indexOf([-1,1]) > -1) { return [-1,1]; }
    if (validDirs.indexOf([-1,-1]) > -1) { return [-1,-1]; }
  }
  if (vector[0] === -1 && vector[1] === 0) {
    if (validDirs.indexOf([0,1]) > -1) { return [0,1]; }
    if (validDirs.indexOf([0,-1]) > -1) { return [0,-1]; }
    if (validDirs.indexOf([1,1]) > -1) { return [1,1]; }
    if (validDirs.indexOf([1,-1]) > -1) { return [1,-1]; }
  }

  // Diagonal
  if (vector[0] === 1 && vector[1] === 1) {
    if (validDirs.indexOf([1,-1]) > -1) { return [1,-1]; }
    if (validDirs.indexOf([-1,1]) > -1) { return [-1,1]; }
  }
  if (vector[0] === 1 && vector[1] === -1) {
    if (validDirs.indexOf([1,1]) > -1) { return [1,1]; }
    if (validDirs.indexOf([-1,-1]) > -1) { return [-1,-1]; }
  }
  if (vector[0] === -1 && vector[1] === -1) {
    if (validDirs.indexOf([-1,1]) > -1) { return [-1,1]; }
    if (validDirs.indexOf([1,-1]) > -1) { return [1,-1]; }
  }
  if (vector[0] === -1 && vector[1] === 1) {
    if (validDirs.indexOf([1,1]) > -1) { return [1,1]; }
    if (validDirs.indexOf([-1,-1]) > -1) { return [-1,-1]; }
    if (validDirs.indexOf([-1,-1]) > -1) { return [-1,-1]; }
  }

  return validDirs[Math.floor(Math.random() * validDirs.length)];
};

// This example randomly chooses direction per choice
var snake_run = function (vector, random) {
  var v = vector;
  var tries = 10000;
  var lv = v;
  var v, i, pos, x, y, validDirs;
  var x = snake.getSnake()[0][0];
  var y = snake.getSnake()[0][1];
  var g = (isSelfCollide) ? gridCombined() : grid.getGrid();
  var validDirs = getValidVectors(x, y, g);

  i = 0;
  var step = function () {
    x = snake.getSnake()[0][0];
    y = snake.getSnake()[0][1];
    g = (isSelfCollide) ? gridCombined() : grid.getGrid();
    validDirs = getValidVectors(x, y, g);

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
      var collide_x = x + lv[0]; 
      var collide_y = y + lv[1];
      if (collide_x >= 0 && collide_x < grid.w && collide_y >= 0 && collide_y < grid.h) {
        var val = grid.getCell(collide_x, collide_y);
        if (val) {
          grid.setCell(collide_x, collide_y, val-1);
        }
      }
      if (isRandom) {
        v = validDirs[Math.floor(Math.random() * validDirs.length)];
      } else {
        v = reflect_vector(lv, validDirs);
      }
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

  // grid.setGrid([
  //     [2,0,0,3,0,0,0,0,0,0],
  //     [0,0,0,0,0,0,0,0,0,0],
  //     [0,0,0,1,0,0,0,2,0,0],
  //     [0,0,0,0,0,0,0,0,0,3],
  //     [0,0,0,0,0,0,0,0,2,3],
  //     [0,0,0,2,0,0,0,0,0,0],
  //     [0,1,0,0,0,0,0,0,0,0],
  //     [0,0,0,0,3,0,0,0,0,0],
  //     [1,0,0,0,0,0,0,0,1,0],
  //     [1,0,0,0,0,0,0,0,0,0]
  //   ]);

  grid.reset();
  // for (var i=0; i<50; i++) { grid.setCellRandom(5); }
  for (var i=0; i<40; i++) { grid.setCellRandom(5); }
  for (var i=0; i<30; i++) { grid.setCellRandom(4); }
  for (var i=0; i<20; i++) { grid.setCellRandom(3); }
  for (var i=0; i<10; i++) { grid.setCellRandom(2); }

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
  range_pixel : document.getElementById('pixel'),
  range_width : document.getElementById('width'),
  range_height : document.getElementById('height'),
  ckbx_random : document.getElementById('random'),
  ckbx_self_collide : document.getElementById('selfcollide')
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
  },
  setWidth : function () {
    var val = parseInt(this.value, 10);
    width = val;
    canvasSize();
    clear();
    render(grid.getGrid());
    renderSnake(snake.getSnake());
  },
  setHeight : function () {
    var val = parseInt(this.value, 10);
    height = val;
    canvasSize();
    clear();
    render(grid.getGrid());
    renderSnake(snake.getSnake());
  },
  setRandom : function (e) {
    console.log(e);
    console.log(e.target.checked);
    isRandom = !!e.target.checked;
  },
  setSelfCollide : function (e) {
    console.log(e);
    console.log(e.target.checked);
    isSelfCollide = !!e.target.checked;
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

ui.range_width.addEventListener('change', listeners.setWidth);
ui.range_width.addEventListener('input', listeners.setWidth);
ui.range_height.addEventListener('change', listeners.setHeight);
ui.range_height.addEventListener('input', listeners.setHeight);

ui.ckbx_random.addEventListener('click', listeners.setRandom);
ui.ckbx_self_collide.addEventListener('click', listeners.setSelfCollide)
init();

});