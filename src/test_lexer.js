
const fs = require("node:fs");
const path = require("node:path");
const { tokenize } = require("./lexer");

const filename = path.join(
  __dirname,
  "../examples/stringliteral.valor"
);

try {
  const source = fs.readFileSync(filename, "utf8");
  const tokens = tokenize(source);

  console.log("VALOR Lexer — Token Output\n");
  console.log(tokens);
} catch (error) {
  console.error("Lexer error:", error.message);
  process.exitCode = 1;
}
