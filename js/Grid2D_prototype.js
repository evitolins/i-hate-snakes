//
// Grid2d
// ============================================================================
// Builds and controls a 2D javascript array with specified width, height and
// default value.
// 
// Example
// ----------------------------------------------------------------------------
//
// var grid = new Grid2D(10, 10, 0);
// 
//   grid = [
//     [0,0,0,0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0,0,0,0]
//   ];
//  
//  Reference
// ----------------------------------------------------------------------------
//  https://github.com/scijs/ndarray
//  

var getRandomCell = function (w, h) {
    return {
      x : Math.floor(Math.random() * w),
      y : Math.floor(Math.random() * h)
    };
};


var Grid2D = function (w, h, defaultVal) {
  this.w = w || 1;
  this.h = h || 1;
  this.defaultVal = defaultVal || 0;
  this.grid = this.build(this.w, this.h, this.defaultVal);
};


Grid2D.prototype.setCell = function (x, y, val) {
  this.grid[y][x] = val;
};


Grid2D.prototype.setCellRandom = function (val) {
  var loopLimit = 1000,
    cell;
  while (loopLimit) {
    loopLimit--;
    cell = getRandomCell(this.w, this.h);
    if (this.getCell(cell.x, cell.y) === this.defaultVal) {
      this.setCell(cell.x, cell.y, val);
      break;
    }
  }
};


Grid2D.prototype.getCell = function (x, y) {
  if (this.grid[y] === undefined) {
    return undefined;
  }
  if (this.grid[y][x] === undefined) {
    return undefined;
  }
  return this.grid[y][x];
};


Grid2D.prototype.getRow = function (y) {
  return this.grid[y];
};


Grid2D.prototype.getColumn = function (x) {
  var column=[],
      i;
  for (i=0; i<this.grid.length; i++) {
    column.push(this.grid[i][x]);
  }
  return column;
};


// Pretty basic, need a more robust version
Grid2D.prototype.getNeighbors = function (x, y) {
  x = x || 0;
  y = y || 0;

  var n = this.getCell(x, y-1),
      ne = this.getCell(x+1, y-1),
      e = this.getCell(x+1, y),
      se = this.getCell(x+1, y+1),
      s = this.getCell(x, y+1),
      sw = this.getCell(x-1,y+1),
      w = this.getCell(x-1, y),
      nw = this.getCell(x-1, y-1);

  return [
     [nw, n, ne],
     [w, [x,y], e],
     [sw, s, se]
    ];
};


Grid2D.prototype.setGrid = function (array) {
  this.grid = array;
};


Grid2D.prototype.getGrid = function () {
  return this.grid;
};


Grid2D.prototype.build = function () {
  var arr = [];
  for (var i = this.h - 1; i >= 0; i--) {
    arr[i] = [];
    for (var j = this.w - 1; j >= 0; j--) {
      arr[i][j] = this.defaultVal;
    }
  };
  return arr;
};

Grid2D.prototype.reset = function () {
  this.grid = this.build();
};

// RequireJS Support
if (typeof define === 'function' && define.amd) {
  define(function() {
    return Grid2D;
  });
}

