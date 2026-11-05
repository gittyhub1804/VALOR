function __valorDivide(left, right) {
  if (right === 0) throw new Error("VALOR runtime error: division by zero.");
  return left / right;
}

let i = 1;
while ((i <= 15)) {
  if (((i % 15) == 0)) {
    console.log("FizzBuzz");
  } else {
    if (((i % 3) == 0)) {
      console.log("Fizz");
    } else {
      if (((i % 5) == 0)) {
        console.log("Buzz");
      } else {
        console.log(i);
      }
    }
  }
  i = (i + 1);
}
