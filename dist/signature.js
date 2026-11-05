function __valorDivide(left, right) {
  if (right === 0) throw new Error("VALOR runtime error: division by zero.");
  return left / right;
}

let studentName = "Reimar";
let score = 92;
let passingScore = 75;
let passed = (score >= passingScore);
console.log("=== VALOR GRADE EVALUATOR ===");
console.log("Student Information");
console.log(studentName);
console.log("Score");
console.log(score);
if (passed) {
  console.log("Result: PASSED");
  if ((score >= 90)) {
    console.log("Remark: EXCELLENT");
  } else {
    console.log("Remark: GOOD");
  }
} else {
  console.log("Result: FAILED");
  console.log("Remark: NEEDS IMPROVEMENT");
}
