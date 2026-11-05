
class JavaScriptGenerator {
  constructor() {
    this.indentLevel = 0;
  }

  generate(program) {
    this.indentLevel = 0;

    const body = program.body
      .map((statement) => this.generateStatement(statement))
      .join("\n");

    // VALOR requires division by zero to raise a runtime error.
    const helper = [
      "function __valorDivide(left, right) {",
      '  if (right === 0) throw new Error("VALOR runtime error: division by zero.");',
      "  return left / right;",
      "}"
    ].join("\n");

    return `${helper}\n\n${body}\n`;
  }

  indent() {
    return "  ".repeat(this.indentLevel);
  }

  generateStatement(statement) {
    const prefix = this.indent();

    switch (statement.type) {
      case "VariableDeclaration":
        return `${prefix}let ${statement.name} = ${this.generateExpression(statement.initializer)};`;

      case "Assignment":
        return `${prefix}${statement.name} = ${this.generateExpression(statement.value)};`;

      case "RevealStatement": {
        const args = statement.arguments
          .map((arg) => this.generateExpression(arg))
          .join(", ");

        return `${prefix}console.log(${args});`;
      }

      case "ExpressionStatement":
        return `${prefix}${this.generateExpression(statement.expression)};`;

      case "ReturnStatement":
        return `${prefix}return ${this.generateExpression(statement.value)};`;

      case "BlockStatement":
        return this.generateBlock(statement);

      case "IfStatement": {
        const condition = this.generateExpression(statement.condition);
        let output = `${prefix}if (${condition}) ${this.generateBlock(statement.consequent)}`;

        if (statement.alternate) {
          output += ` else ${this.generateBlock(statement.alternate)}`;
        }

        return output;
      }

      case "WhileStatement": {
        const condition = this.generateExpression(statement.condition);
        return `${prefix}while (${condition}) ${this.generateBlock(statement.body)}`;
      }

      case "FunctionDeclaration": {
        const parameters = statement.parameters
          .map((parameter) => parameter.name)
          .join(", ");

        return `${prefix}function ${statement.name}(${parameters}) ${this.generateBlock(statement.body)}`;
      }

      default:
        throw new Error(
          `Code generation error: Unsupported statement '${statement.type}'.`
        );
    }
  }

  generateBlock(block) {
    const opening = "{";
    this.indentLevel++;

    const body = block.body
      .map((statement) => this.generateStatement(statement))
      .join("\n");

    this.indentLevel--;

    if (body.length === 0) {
      return `${opening}}`;
    }

    return `${opening}\n${body}\n${this.indent()}}`;
  }

  generateExpression(expression) {
    switch (expression.type) {
      case "NumberLiteral":
        return String(expression.value);

      case "StringLiteral":
        return JSON.stringify(expression.value);

      case "BooleanLiteral":
        return String(expression.value);

      case "Identifier":
        return expression.name;

      case "GroupingExpression":
        return `(${this.generateExpression(expression.expression)})`;

      case "UnaryExpression":
        return `(${expression.operator}${this.generateExpression(expression.argument)})`;

      case "BinaryExpression": {
        const left = this.generateExpression(expression.left);
        const right = this.generateExpression(expression.right);

        if (expression.operator === "/") {
          return `__valorDivide(${left}, ${right})`;
        }

        return `(${left} ${expression.operator} ${right})`;
      }

      case "CallExpression": {
        const args = expression.arguments
          .map((argument) => this.generateExpression(argument))
          .join(", ");

        return `${expression.callee}(${args})`;
      }

      default:
        throw new Error(
          `Code generation error: Unsupported expression '${expression.type}'.`
        );
    }
  }
}

module.exports = { JavaScriptGenerator };
