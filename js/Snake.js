// Snake Object
// - Snake object starts as a single point, and extends as it moves
// - Collisions are handled externally
var Snake = function (x, y, maxLength) {
  var maxLen, snake,

      move = function (x, y) {
        var newX = snake[0][0] + x,
            newY = snake[0][1] + y;
        snake.unshift([newX, newY]);
        snake = snake.slice(0, maxLen);
      },

      getSnake = function () {
        return snake;
      },

      setSnake = function (array) {
        snake = array.slice(0, maxLen) || [];
      },

      getMaxLength = function (int) {
        return maxLen;
      },

      setMaxLength = function (int) {
        maxLen = int || 1;
        snake = snake.slice(0, maxLen);
      },

      init = function (x, y, maxLength) {
        setSnake([[x,y]]);
        setMaxLength(maxLength);
      };

      init(x, y, maxLength);

      return {
        move : move,
        getSnake : getSnake,
        setSnake : setSnake,
        getMaxLength : getMaxLength,
        setMaxLength : setMaxLength,
        init : init
      };
};

// RequireJS Support
if (typeof define === 'function' && define.amd) {
  define(function() {
    return Snake;
  });
}