
const KEYWORDS = new Set([ //lexer.js
  "let",
  "fn",
  "return",
  "if",
  "else",
  "while",
  "true",
  "false",
  "number",
  "string",
  "boolean",
]);

function tokenize(source) {
  const tokens = [];
  let position = 0;

  while (position < source.length) {
    const char = source[position];

    // Ignore whitespace
    if (/\s/.test(char)) {
      position++;
      continue;
    }

    // Ignore single-line comments
    if (source.startsWith("//", position)) {
      while (
        position < source.length &&
        source[position] !== "\n"
      ) {
        position++;
      }
      continue;
    }

    // Read identifiers and keywords
    if (/[A-Za-z_]/.test(char)) {
      let value = "";

      while (
        position < source.length &&
        /[A-Za-z0-9_]/.test(source[position])
      ) {
        value += source[position];
        position++;
      }

      const type = KEYWORDS.has(value)
        ? "KEYWORD"
        : "IDENTIFIER";

      tokens.push({ type, value });
      continue;
    }

    // Read integer and decimal numbers
    if (/[0-9]/.test(char)) {
      let value = "";

      while (
        position < source.length &&
        /[0-9]/.test(source[position])
      ) {
        value += source[position];
        position++;
      }

      if (
        source[position] === "." &&
        /[0-9]/.test(source[position + 1] ?? "")
      ) {
        value += ".";
        position++;

        while (
          position < source.length &&
          /[0-9]/.test(source[position])
        ) {
          value += source[position];
          position++;
        }
      }

      tokens.push({ type: "NUMBER", value });
      continue;
    }

    // Read strings
    if (char === '"') {
      position++;
      let value = "";
      let closed = false;

      while (position < source.length) {
        const current = source[position++];

        if (current === '"') {
          closed = true;
          break;
        }

        if (current === "\\") {
          if (position >= source.length) {
            throw new Error("Unterminated string escape.");
          }

          const escaped = source[position++];

          const escapes = {
            n: "\n",
            t: "\t",
            '"': '"',
            "\\": "\\",
          };

          if (!Object.hasOwn(escapes, escaped)) {
            throw new Error(
              `Invalid escape sequence: \\${escaped}`
            );
          }

          value += escapes[escaped];
        } else {
          value += current;
        }
      }

      if (!closed) {
        throw new Error("Unterminated string literal.");
      }

      tokens.push({ type: "STRING", value });
      continue;
    }

    // Read two-character operators first
    const twoChar = source.slice(position, position + 2);
    const doubleOperators = [
      "==", "!=", "<=", ">=", "&&", "||",
    ];

    if (doubleOperators.includes(twoChar)) {
      tokens.push({ type: "OPERATOR", value: twoChar });
      position += 2;
      continue;
    }

    // Read single-character operators and punctuation
    const operators = "+-*/%=<>!";
    const punctuation = "(){} ,;:".replace(" ", "");

    if (operators.includes(char)) {
      tokens.push({ type: "OPERATOR", value: char });
      position++;
      continue;
    }

    if (punctuation.includes(char)) {
      tokens.push({ type: "PUNCTUATION", value: char });
      position++;
      continue;
    }

    throw new Error(
      `Unexpected character '${char}' at position ${position}.`
    );
  }

  tokens.push({ type: "EOF", value: "" });

  return tokens;
}

module.exports = { tokenize };
