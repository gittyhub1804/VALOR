
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  peek() {
    return this.tokens[this.current];
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  isAtEnd() {
    return this.peek().type === "EOF";
  }

  check(value) {
    return !this.isAtEnd() && this.peek().value === value;
  }

  advance() {
    if (!this.isAtEnd()) {
      this.current++;
    }

    return this.previous();
  }

  match(...values) {
    for (const value of values) {
      if (this.check(value)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  consume(value, message) {
    if (this.check(value)) {
      return this.advance();
    }

    throw this.error(message);
  }

  error(message) {
    const token = this.peek();

    return new Error(
      `Parser error at '${token.value || "EOF"}': ${message}`
    );
  }

  parse() {
    const statements = [];

    while (!this.isAtEnd()) {
      const start = this.current;

      if (this.check("fn")) {
        statements.push(this.functionDeclaration());
      } else {
        statements.push(this.statement());
      }

      // Defensive check: every successful parse step must consume input.
      if (this.current === start) {
        throw this.error("Parser made no progress.");
      }
    }

    return {
      type: "Program",
      body: statements,
    };
  }

  statement() {
    if (this.match("let")) {
        return this.variableDeclaration();
    }

    if (this.match("if")) {
        return this.ifStatement();
    }

    if (this.match("while")) {
        return this.whileStatement();
    }

    if (this.match("return")) {
        return this.returnStatement();
    }

    if (this.match("reveal")) {
        return this.revealStatement();
    }

    if (this.check("{")) {
      return this.block();
    }

    // An identifier followed by "=" is an assignment.
    // Otherwise, parse it as an expression statement.
    if (
      this.peek().type === "IDENTIFIER" &&
      this.tokens[this.current + 1]?.value === "="
    ) {
      return this.assignmentStatement();
    }

    return this.expressionStatement();
  }

  variableDeclaration() {
    const name = this.consumeIdentifier(
      "Expected a variable name after 'let'."
    );

    this.consume(":", "Expected ':' after variable name.");

    const declaredType = this.typeName();

    this.consume("=", "Expected '=' before initializer.");

    const initializer = this.expression();

    this.consume(";", "Expected ';' after declaration.");

    return {
      type: "VariableDeclaration",
      name: name.value,
      declaredType,
      initializer,
    };
  }

  assignmentStatement() {
    const name = this.consumeIdentifier(
      "Expected a variable name."
    );

    this.consume("=", "Expected '=' in assignment.");

    const value = this.expression();

    this.consume(";", "Expected ';' after assignment.");

    return {
      type: "Assignment",
      name: name.value,
      value,
    };
  }

  revealStatement() {
    this.consume("(", "Expected '(' after 'reveal'.");

    const args = this.argumentList(")");

    this.consume(")", "Expected ')' after reveal arguments.");
    this.consume(";", "Expected ';' after reveal statement.");

    return {
      type: "RevealStatement",
      arguments: args,
    };
  }

  ifStatement() {
    this.consume("(", "Expected '(' after 'if'.");

    const condition = this.expression();

    this.consume(")", "Expected ')' after condition.");

    const consequent = this.block();

    let alternate = null;

    if (this.match("else")) {
      alternate = this.block();
    }

    return {
      type: "IfStatement",
      condition,
      consequent,
      alternate,
    };
  }

  whileStatement() {
    this.consume("(", "Expected '(' after 'while'.");

    const condition = this.expression();

    this.consume(")", "Expected ')' after condition.");

    const body = this.block();

    return {
      type: "WhileStatement",
      condition,
      body,
    };
  }

  returnStatement() {
    const value = this.expression();

    this.consume(";", "Expected ';' after return value.");

    return {
      type: "ReturnStatement",
      value,
    };
  }

  block() {
    this.consume("{", "Expected '{' to start block.");

    const statements = [];

    while (!this.check("}") && !this.isAtEnd()) {
      if (this.check("fn")) {
        throw this.error(
          "Function declarations are only allowed at program level."
        );
      }

      statements.push(this.statement());
    }

    this.consume("}", "Expected '}' after block.");

    return {
      type: "BlockStatement",
      body: statements,
    };
  }

  functionDeclaration() {
    this.consume("fn", "Expected 'fn'.");

    const name = this.consumeIdentifier(
      "Expected a function name."
    );

    this.consume("(", "Expected '(' after function name.");

    const parameters = [];

    if (!this.check(")")) {
      do {
        const paramName = this.consumeIdentifier(
          "Expected a parameter name."
        );

        this.consume(":", "Expected ':' after parameter name.");

        parameters.push({
          name: paramName.value,
          paramType: this.typeName(),
        });
      } while (this.match(","));
    }

    this.consume(")", "Expected ')' after parameters.");

    this.consume(":", "Expected ':' before return type.");

    const returnType = this.typeName();
    const body = this.block();

    return {
      type: "FunctionDeclaration",
      name: name.value,
      parameters,
      returnType,
      body,
    };
  }

  typeName() {
    if (
      this.match("number", "string", "boolean")
    ) {
      return this.previous().value;
    }

    throw this.error(
      "Expected type 'number', 'string', or 'boolean'."
    );
  }

  consumeIdentifier(message) {
    if (this.peek().type === "IDENTIFIER") {
      return this.advance();
    }

    throw this.error(message);
  }

  expressionStatement() {
    const expression = this.expression();

    this.consume(";", "Expected ';' after expression.");

    return {
      type: "ExpressionStatement",
      expression,
    };
  }

  expression() {
    return this.logicalOr();
  }

  logicalOr() {
    let expression = this.logicalAnd();

    while (this.match("||")) {
      const operator = this.previous().value;
      const right = this.logicalAnd();

      expression = {
        type: "BinaryExpression",
        operator,
        left: expression,
        right,
      };
    }

    return expression;
  }

  logicalAnd() {
    let expression = this.equality();

    while (this.match("&&")) {
      const operator = this.previous().value;
      const right = this.equality();

      expression = {
        type: "BinaryExpression",
        operator,
        left: expression,
        right,
      };
    }

    return expression;
  }

  equality() {
    let expression = this.comparison();

    if (this.match("==", "!=")) {
      const operator = this.previous().value;
      const right = this.comparison();

      expression = {
        type: "BinaryExpression",
        operator,
        left: expression,
        right,
      };
    }

    return expression;
  }

  comparison() {
    let expression = this.additive();

    if (this.match("<", ">", "<=", ">=")) {
      const operator = this.previous().value;
      const right = this.additive();

      expression = {
        type: "BinaryExpression",
        operator,
        left: expression,
        right,
      };
    }

    return expression;
  }

  additive() {
    let expression = this.multiplicative();

    while (this.match("+", "-")) {
      const operator = this.previous().value;
      const right = this.multiplicative();

      expression = {
        type: "BinaryExpression",
        operator,
        left: expression,
        right,
      };
    }

    return expression;
  }

  multiplicative() {
    let expression = this.unary();

    while (this.match("*", "/", "%")) {
      const operator = this.previous().value;
      const right = this.unary();

      expression = {
        type: "BinaryExpression",
        operator,
        left: expression,
        right,
      };
    }

    return expression;
  }

  unary() {
    if (this.match("!", "-")) {
      const operator = this.previous().value;
      const argument = this.unary();

      return {
        type: "UnaryExpression",
        operator,
        argument,
      };
    }

    return this.primary();
  }

  primary() {
    if (this.match("true")) {
      return {
        type: "BooleanLiteral",
        value: true,
      };
    }

    if (this.match("false")) {
      return {
        type: "BooleanLiteral",
        value: false,
      };
    }

    if (this.peek().type === "NUMBER") {
      return {
        type: "NumberLiteral",
        value: Number(this.advance().value),
      };
    }

    if (this.peek().type === "STRING") {
      return {
        type: "StringLiteral",
        value: this.advance().value,
      };
    }

    if (this.match("(")) {
      const expression = this.expression();

      this.consume(")", "Expected ')' after expression.");

      return {
        type: "GroupingExpression",
        expression,
      };
    }

    if (this.peek().type === "IDENTIFIER") {
      const name = this.advance().value;

      // An identifier followed by '(' is a function call.
      if (this.match("(")) {
        const args = this.argumentList(")");

        this.consume(")", "Expected ')' after arguments.");

        return {
          type: "CallExpression",
          callee: name,
          arguments: args,
        };
      }

      return {
        type: "Identifier",
        name,
      };
    }

    throw this.error("Expected an expression.");
  }

  argumentList(endToken) {
    const args = [];

    if (!this.check(endToken)) {
      do {
        args.push(this.expression());
      } while (this.match(","));
    }

    return args;
  }
}

module.exports = { Parser };
