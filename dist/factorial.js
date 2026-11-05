function __valorDivide(left, right) {
  if (right === 0) throw new Error("VALOR runtime error: division by zero.");
  return left / right;
}

function factorial(n) {
  if ((n <= 1)) {
    return 1;
  } else {
    return (n * factorial((n - 1)));
  }
}
let result = factorial(5);
console.log(result);
