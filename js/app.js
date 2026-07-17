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
var numSnakes = 3;
var grid = new Grid2D(width, height, 0);
var snakes = [];
var isRandom = true;
var isSelfCollide = false;
var isPlaying = true;
var isHideDots = false;
var isHideSnakes = false;

// Snapshot of grid + snake start positions/vectors, captured on regenerate so
// "reset" can rewind to it instead of randomizing again
var initialState = null;

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

// Biased away from the extremes so every snake stays visible against the dark canvas
var randomColor = function () {
  return [
    60 + Math.floor(Math.random() * 180),
    60 + Math.floor(Math.random() * 180),
    60 + Math.floor(Math.random() * 180)
  ];
};

var cloneGrid = function (gridData) {
  return _.map(gridData, function (row) { return row.slice(); });
};

// Combines grid and all snake bodies to evaluate collisions
var gridCombined = function () {
  var gridCopy = _.map(grid.getGrid(), _.clone);
  var snakeVals, pos, s, i;
  for (s=0; s<snakes.length; s++) {
    snakeVals = snakes[s].instance.getSnake();
    for (i=0; i<snakeVals.length; i++) {
      pos = snakeVals[i];
      gridCopy[pos[1]][pos[0]] = 4;
    }
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


var renderSnake = function (snakeArray, color) {
  var i, x, y, rgba_shadow, rgba_main, rgba_head;
  rgba_shadow = [255, 255, 255, 0.2];
  rgba_main = [color[0], color[1], color[2], 0.85];
  rgba_head = [color[0], color[1], color[2], 0.95];

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
  context.fillStyle = colorArrayToRGBA(rgba_head);
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

// Advances a single snake by one step, choosing a new direction when blocked
var stepSnake = function (snk) {
  var head = snk.instance.getSnake()[0];
  var x = head[0];
  var y = head[1];
  var g = (isSelfCollide) ? gridCombined() : grid.getGrid();
  var validDirs = getValidVectors(x, y, g);
  var v, collide_x, collide_y, val;

  // Quit
  if (!validDirs.length) {
    snk.alive = false;
    return;
  }

  // Maintain course
  if (validDirs.indexOf(snk.lv) > -1) {
    v = snk.lv;
  }
  // Choose new direction
  else {
    collide_x = x + snk.lv[0];
    collide_y = y + snk.lv[1];
    if (collide_x >= 0 && collide_x < grid.w && collide_y >= 0 && collide_y < grid.h) {
      val = grid.getCell(collide_x, collide_y);
      if (val) {
        grid.setCell(collide_x, collide_y, val-1);
      }
    }
    if (isRandom) {
      v = validDirs[Math.floor(Math.random() * validDirs.length)];
    } else {
      v = reflect_vector(snk.lv, validDirs);
    }
  }
  snk.lv = v;
  snk.instance.move(v[0], v[1]);
};

// Steps every snake once per tick, stopping once none can move
var snake_run = function () {
  var tries = 10000;
  var i = 0;
  var running = true;

  var step = function () {
    var s, anyAlive = false;
    for (s=0; s<snakes.length; s++) {
      if (!snakes[s].alive) {
        continue;
      }
      stepSnake(snakes[s]);
      if (snakes[s].alive) {
        anyAlive = true;
      }
    }
    renderAllSnakes();
    i++;
    running = anyAlive;
  };

  var next = function () {
    if (i <= tries && running) {
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

// Builds numSnakes fresh Snake instances at non-overlapping (best-effort) start cells
var createSnakes = function () {
  var used = {};
  var n, rx, ry, key, attempts, inst;

  snakes = [];
  for (n=0; n<numSnakes; n++) {
    attempts = 100;
    do {
      rx = Math.floor(Math.random() * width);
      ry = Math.floor(Math.random() * height);
      key = rx + ',' + ry;
      attempts--;
    } while (used[key] && attempts > 0);
    used[key] = true;

    inst = new Snake();
    inst.init(rx, ry, tailMaxLength);

    snakes.push({
      instance: inst,
      lv: vectorTable[Math.floor(Math.random() * vectorTable.length)],
      color: randomColor(),
      alive: true
    });
  }
};

// Snapshots the current grid + each snake's start position/vector/color, so
// "reset" can rewind to this exact layout instead of randomizing again
var captureInitialState = function () {
  initialState = {
    gridData: cloneGrid(grid.getGrid()),
    snakes: _.map(snakes, function (snk) {
      var head = snk.instance.getSnake()[0];
      return {
        x: head[0],
        y: head[1],
        lv: snk.lv,
        color: snk.color
      };
    })
  };
};

// Rebuilds a brand new random grid + snake set (new dots, new snakes)
var regenerate = function () {
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

  createSnakes();
  captureInitialState();
  renderAllSnakes();
  isPlaying = true;
  ui.btn_playpause.textContent = 'pause';
  snake_run();
};

// Rewinds to the last regenerated layout: same dots, same snake start
// positions/vectors/colors, but honoring whatever the sliders are set to now
var restart = function () {
  var s, snap, inst;

  if (!initialState) {
    regenerate();
    return;
  }

  canvasSize();
  grid.setGrid(cloneGrid(initialState.gridData));

  snakes = [];
  for (s=0; s<initialState.snakes.length; s++) {
    snap = initialState.snakes[s];
    inst = new Snake();
    inst.init(snap.x, snap.y, tailMaxLength);
    snakes.push({
      instance: inst,
      lv: snap.lv,
      color: snap.color,
      alive: true
    });
  }

  renderAllSnakes();
  isPlaying = true;
  ui.btn_playpause.textContent = 'pause';
  snake_run();
};

var ui = {
  btn_playpause : document.getElementById('playpause'),
  btn_reset : document.getElementById('reset'),
  btn_regenerate : document.getElementById('regenerate'),
  range_numsnakes : document.getElementById('numsnakes'),
  range_tail : document.getElementById('tail'),
  range_freq : document.getElementById('freq'),
  range_pixel : document.getElementById('pixel'),
  range_width : document.getElementById('width'),
  range_height : document.getElementById('height'),
  ckbx_random : document.getElementById('random'),
  ckbx_self_collide : document.getElementById('selfcollide'),
  ckbx_hide_dots : document.getElementById('hidedots'),
  ckbx_hide_snakes : document.getElementById('hidesnakes')
};

var renderAllSnakes = function () {
  clear();
  if (!isHideDots) {
    render(grid.getGrid());
  }
  if (!isHideSnakes) {
    for (var s=0; s<snakes.length; s++) {
      renderSnake(snakes[s].instance.getSnake(), snakes[s].color);
    }
  }
};

var listeners = {
  togglePlay : function () {
    if (isPlaying) {
      refresh.reset();
      isPlaying = false;
    } else {
      refresh.start();
      isPlaying = true;
    }
    ui.btn_playpause.textContent = isPlaying ? 'pause' : 'play';
  },
  reset : function(){
    restart();
  },
  regenerate : function(){
    regenerate();
  },
  setNumSnakes : function () {
    var val = parseInt(this.value, 10);
    numSnakes = val;
    regenerate();
  },
  setMaxLength : function () {
    var val = parseInt(this.value, 10);
    tailMaxLength = val;
    for (var s=0; s<snakes.length; s++) {
      snakes[s].instance.setMaxLength(val);
    }
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
    renderAllSnakes();
  },
  setWidth : function () {
    var val = parseInt(this.value, 10);
    width = val;
    canvasSize();
    renderAllSnakes();
  },
  setHeight : function () {
    var val = parseInt(this.value, 10);
    height = val;
    canvasSize();
    renderAllSnakes();
  },
  setRandom : function (e) {
    isRandom = !!e.target.checked;
  },
  setSelfCollide : function (e) {
    isSelfCollide = !!e.target.checked;
  },
  setHideDots : function (e) {
    isHideDots = !!e.target.checked;
    renderAllSnakes();
  },
  setHideSnakes : function (e) {
    isHideSnakes = !!e.target.checked;
    renderAllSnakes();
  }
};

// Bind UI
ui.btn_playpause.addEventListener('click', listeners.togglePlay);
ui.btn_reset.addEventListener('click', listeners.reset);
ui.btn_regenerate.addEventListener('click', listeners.regenerate);
ui.range_numsnakes.addEventListener('change', listeners.setNumSnakes);
ui.range_numsnakes.addEventListener('input', listeners.setNumSnakes);
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
ui.ckbx_self_collide.addEventListener('click', listeners.setSelfCollide);
ui.ckbx_hide_dots.addEventListener('click', listeners.setHideDots);
ui.ckbx_hide_snakes.addEventListener('click', listeners.setHideSnakes);
regenerate();

});