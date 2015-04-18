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

    setGrid = function (array) {
      grid = array;
    },

    getGrid = function () {
      return grid;
    },

    build = function (w ,h, defaultVal) {
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
    defaultVal = defaultVal || undefined;
    grid = build(w, h, defaultVal);

    return {
      setCell : setCell,
      getCell : getCell,
      setGrid : setGrid,
      getGrid : getGrid
    };
};

// RequireJS Support
define(function () {
    return Grid2D;
});
