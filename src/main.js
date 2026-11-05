
const fs = require("fs");
const path = require("path");

const { tokenize } = require("./lexer");
const { Parser } = require("./parser");
const { SemanticAnalyzer } = require("./semantics");
const { JavaScriptGenerator } = require("./codegen");

const sourcePath = path.join(__dirname, "..", "examples", "try.valor");
const outputDirectory = path.join(__dirname, "..", "dist");
const outputPath = path.join(outputDirectory, "try.js");

try {
  // Stage 1: Lexical analysis
  const source = fs.readFileSync(sourcePath, "utf8");
  const tokens = tokenize(source);

  // Stage 2: Syntax analysis
  const parser = new Parser(tokens);
  const ast = parser.parse();

  // Stage 3: Semantic analysis
  const analyzer = new SemanticAnalyzer();
  analyzer.analyze(ast);

  // Stage 4: JavaScript code generation
  const generator = new JavaScriptGenerator();
  const javascript = generator.generate(ast);

  // Save the generated JavaScript file.
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(outputPath, javascript, "utf8");

  console.log("VALOR compilation successful!");
  console.log("Lexing: successful");
  console.log("Parsing: successful");
  console.log("Semantic analysis: successful");
  console.log("JavaScript generation: successful");
  console.log(`\nGenerated file: ${outputPath}`);
  console.log("\nGenerated JavaScript:\n");
  console.log(javascript);
} catch (error) {
  console.error("\nVALOR compilation failed:");
  console.error(error.message);
  process.exitCode = 1;
}
