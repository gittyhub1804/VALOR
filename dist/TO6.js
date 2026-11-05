function __valorDivide(left, right) {
  if (right === 0) throw new Error("VALOR runtime error: division by zero.");
  return left / right;
}

let score = 40;
if ((score >= 60)) {
  if ((score >= 90)) {
    console.log("Grade: A");
  } else {
    console.log("Grade: B");
  }
} else {
  console.log("Grade: F");
}
