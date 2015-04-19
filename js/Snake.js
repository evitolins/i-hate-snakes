// Snake Object
var Snake = function (x, y, length) {
  var len = length || 1,
      snake = [[x, y]],

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
      };

      return {
        move : move,
        getSnake : getSnake
      };
};

// RequireJS Support
define(function () {
    return Snake;
});