
class SemanticAnalyzer {
  constructor() {
    this.scopes = [new Map()];
    this.functions = new Map();
    this.currentFunction = null;
  }

  analyze(program) {
    // Register function signatures first so functions can call each other.
    for (const statement of program.body) {
      if (statement.type === "FunctionDeclaration") {
        if (this.functions.has(statement.name)) {
          throw new Error(
            `Semantic error: Function '${statement.name}' is already declared.`
          );
        }

        this.functions.set(statement.name, {
          parameters: statement.parameters.map((p) => p.paramType),
          returnType: statement.returnType
        });
      }
    }

    // Check the program.
    for (const statement of program.body) {
      this.checkStatement(statement);
    }

    return program;
  }

  error(message) {
    throw new Error(`Semantic error: ${message}`);
  }

  currentScope() {
    return this.scopes[this.scopes.length - 1];
  }

  enterScope() {
    this.scopes.push(new Map());
  }

  exitScope() {
    this.scopes.pop();
  }

  declareVariable(name, type) {
    const scope = this.currentScope();

    if (scope.has(name)) {
      this.error(`Variable '${name}' is already declared in this scope.`);
    }

    scope.set(name, type);
  }

  lookupVariable(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name)) {
        return this.scopes[i].get(name);
      }
    }

    this.error(`Variable '${name}' has not been declared.`);
  }

  requireType(actual, expected, context) {
    if (actual !== expected) {
      this.error(
        `${context}: expected '${expected}', but received '${actual}'.`
      );
    }
  }

  checkStatement(statement) {
    switch (statement.type) {
      case "VariableDeclaration": {
        const actualType = this.checkExpression(statement.initializer);

        this.requireType(
          actualType,
          statement.declaredType,
          `Initializer of variable '${statement.name}'`
        );

        this.declareVariable(statement.name, statement.declaredType);
        return false;
      }

      case "Assignment": {
        const variableType = this.lookupVariable(statement.name);
        const valueType = this.checkExpression(statement.value);

        this.requireType(
          valueType,
          variableType,
          `Assignment to variable '${statement.name}'`
        );

        return false;
      }

      case "RevealStatement": {
        for (const argument of statement.arguments) {
          this.checkExpression(argument);
        }

        return false;
      }

      case "ExpressionStatement":
        this.checkExpression(statement.expression);
        return false;

      case "BlockStatement": {
        this.enterScope();
        let definitelyReturns = false;

        try {
          for (const child of statement.body) {
            const childReturns = this.checkStatement(child);

            if (!definitelyReturns && childReturns) {
              definitelyReturns = true;
            }
          }
        } finally {
          this.exitScope();
        }

        return definitelyReturns;
      }

      case "IfStatement": {
        const conditionType = this.checkExpression(statement.condition);

        this.requireType(
          conditionType,
          "boolean",
          "If condition"
        );

        const thenReturns = this.checkStatement(statement.consequent);
        const elseReturns = statement.alternate
          ? this.checkStatement(statement.alternate)
          : false;

        return thenReturns && elseReturns;
      }

      case "WhileStatement": {
        const conditionType = this.checkExpression(statement.condition);

        this.requireType(
          conditionType,
          "boolean",
          "While condition"
        );

        this.checkStatement(statement.body);
        return false;
      }

      case "ReturnStatement": {
        if (!this.currentFunction) {
          this.error("'return' can only be used inside a function.");
        }

        const actualType = this.checkExpression(statement.value);

        this.requireType(
          actualType,
          this.currentFunction.returnType,
          `Return value of function '${this.currentFunction.name}'`
        );

        return true;
      }

      case "FunctionDeclaration":
        return this.checkFunction(statement);

      default:
        this.error(`Unsupported statement '${statement.type}'.`);
    }
  }

  checkFunction(statement) {
    const previousFunction = this.currentFunction;

    this.currentFunction = {
      name: statement.name,
      returnType: statement.returnType
    };

    this.enterScope();

    try {
      for (const parameter of statement.parameters) {
        this.declareVariable(parameter.name, parameter.paramType);
      }

      const definitelyReturns = this.checkStatement(statement.body);

      if (!definitelyReturns) {
        this.error(
          `Function '${statement.name}' must return a '${statement.returnType}' value on every path.`
        );
      }
    } finally {
      this.exitScope();
      this.currentFunction = previousFunction;
    }

    return false;
  }

  checkExpression(expression) {
    switch (expression.type) {
      case "NumberLiteral":
        return "number";

      case "StringLiteral":
        return "string";

      case "BooleanLiteral":
        return "boolean";

      case "Identifier":
        return this.lookupVariable(expression.name);

      case "GroupingExpression":
        return this.checkExpression(expression.expression);

      case "UnaryExpression": {
        const argumentType = this.checkExpression(expression.argument);

        if (expression.operator === "-") {
          this.requireType(argumentType, "number", "Unary '-' operator");
          return "number";
        }

        if (expression.operator === "!") {
          this.requireType(argumentType, "boolean", "Unary '!' operator");
          return "boolean";
        }

        this.error(`Unsupported unary operator '${expression.operator}'.`);
        break;
      }

      case "BinaryExpression":
        return this.checkBinaryExpression(expression);

      case "CallExpression":
        return this.checkFunctionCall(expression);

      default:
        this.error(`Unsupported expression '${expression.type}'.`);
    }
  }

  checkBinaryExpression(expression) {
    const leftType = this.checkExpression(expression.left);
    const rightType = this.checkExpression(expression.right);
    const operator = expression.operator;

    if (operator === "+") {
      if (leftType === "number" && rightType === "number") {
        return "number";
      }

      if (leftType === "string" && rightType === "string") {
        return "string";
      }

      this.error(
        "Operator '+' requires two numbers or two strings."
      );
    }

    if (["-", "*", "/", "%"].includes(operator)) {
      this.requireType(leftType, "number", `Left operand of '${operator}'`);
      this.requireType(rightType, "number", `Right operand of '${operator}'`);
      return "number";
    }

    if (["<", ">", "<=", ">="].includes(operator)) {
      this.requireType(leftType, "number", `Left operand of '${operator}'`);
      this.requireType(rightType, "number", `Right operand of '${operator}'`);
      return "boolean";
    }

    if (["==", "!="].includes(operator)) {
      if (leftType !== rightType) {
        this.error(
          `Operator '${operator}' requires operands of the same type.`
        );
      }

      return "boolean";
    }

    if (["&&", "||"].includes(operator)) {
      this.requireType(leftType, "boolean", `Left operand of '${operator}'`);
      this.requireType(rightType, "boolean", `Right operand of '${operator}'`);
      return "boolean";
    }

    this.error(`Unsupported binary operator '${operator}'.`);
  }

  checkFunctionCall(expression) {
    const signature = this.functions.get(expression.callee);

    if (!signature) {
      this.error(`Function '${expression.callee}' has not been declared.`);
    }

    if (expression.arguments.length !== signature.parameters.length) {
      this.error(
        `Function '${expression.callee}' expects ${signature.parameters.length} argument(s), but received ${expression.arguments.length}.`
      );
    }

    expression.arguments.forEach((argument, index) => {
      const actualType = this.checkExpression(argument);
      const expectedType = signature.parameters[index];

      this.requireType(
        actualType,
        expectedType,
        `Argument ${index + 1} of function '${expression.callee}'`
      );
    });

    return signature.returnType;
  }
}

module.exports = { SemanticAnalyzer };
