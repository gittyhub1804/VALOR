function __valorDivide(left, right) {
  if (right === 0) throw new Error("VALOR runtime error: division by zero.");
  return left / right;
}

function countdown(n) {
  if ((n <= 0)) {
    return 0;
  } else {
    return (n + countdown((n - 1)));
  }
}
console.log(countdown(0));
console.log(countdown(1));
console.log(countdown(4));
