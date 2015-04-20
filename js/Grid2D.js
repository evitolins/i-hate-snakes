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

var Grid2D = function (w, h, defaultVal) {
  var grid = [],

    setCell = function (x, y, val) {
      grid[y][x] = val;
    },

    getCell = function (x, y) {
      if (grid[y] === undefined) {
        return undefined;
      }
      if (grid[y][x] === undefined) {
        return undefined;
      }
      return grid[y][x];
    },

    getRow = function (y) {
      return grid[y];
    },

    getColumn = function (x) {
      var column=[],
          i;
      for (i=0; i<grid.length; i++) {
        column.push(grid[i][x]);
      }
      return column;
    },

    // Pretty basic, need a more robust version
    getNeighbors = function (x, y) {
      x = x || 0;
      y = y || 0;

      var n = getCell(x, y-1),
          ne = getCell(x+1, y-1),
          e = getCell(x+1, y),
          se = getCell(x+1, y+1),
          s = getCell(x, y+1),
          sw = getCell(x-1,y+1),
          w = getCell(x-1, y),
          nw = getCell(x-1, y-1);

      return [
         [nw, n, ne],
         [w, [x,y], e],
         [sw, s, se]
        ];
    },

    setGrid = function (array) {
      grid = array;
    },

    getGrid = function () {
      return grid;
    },

    build = function (w, h, defaultVal) {
      var arr = [];
      for (var i = h - 1; i >= 0; i--) {
        arr[i] = [];
        for (var j = w - 1; j >= 0; j--) {
          arr[i][j] = defaultVal;
        }
      };
      return arr;
    };

    // Build a grid w x h, using default value;
    w = w || 1;
    h = h || 1;
    defaultVal = defaultVal;
    grid = build(w, h, defaultVal);

    return {
      setCell : setCell,
      getCell : getCell,
      setGrid : setGrid,
      getGrid : getGrid,
      getRow  : getRow,
      getColumn : getColumn,
      getNeighbors : getNeighbors
    };
};

// RequireJS Support
if (typeof define === 'function' && define.amd) {
  define(function() {
    return Grid2D;
  });
}

