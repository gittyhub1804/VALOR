function __valorDivide(left, right) {
  if (right === 0) throw new Error("VALOR runtime error: division by zero.");
  return left / right;
}

let name = "VALOR";
console.log((("Hello, " + name) + "!"));
