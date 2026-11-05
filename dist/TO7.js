function __valorDivide(left, right) {
  if (right === 0) throw new Error("VALOR runtime error: division by zero.");
  return left / right;
}

let count = 1;
while ((count <= 5)) {
  console.log(count);
  count = (count + 1);
}
console.log("Loop finished");
