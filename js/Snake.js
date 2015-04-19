// Snake Object
// - Snake object starts as a single point, and extends as it moves
// - Collisions are handled externally
var Snake = function (x, y, length) {
  var len, snake,

      move = function (x, y) {
        var newX = snake[0][0] + x,
            newY = snake[0][1] + y;
        snake.unshift([newX, newY]);
        if (snake.length > len) {
          snake.pop();
        }
      },

      getSnake = function () {
        return snake;
      },

      init = function (x, y, length) {
        len = length || 1;
        snake = [[x, y]];
      };

      init(x, y, length);

      return {
        init : init,
        move : move,
        getSnake : getSnake
      };
};

// RequireJS Support
if (typeof define === 'function' && define.amd) {
  define(function() {
    return Snake;
  });
}