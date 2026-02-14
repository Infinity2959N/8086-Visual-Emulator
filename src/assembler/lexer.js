// lexer.js
// Converts raw assembly text into cleaned line tokens

function lexer(code) {
  const lines = code.split("\n");

  const tokens = [];

  for (let line of lines) {

    // Remove comments
    const commentIndex = line.indexOf(";");
    if (commentIndex !== -1) {
      line = line.substring(0, commentIndex);
    }

    line = line.trim();

    if (line.length === 0) continue;

    // Normalize to uppercase (8086 is case-insensitive)
    line = line.toUpperCase();

    tokens.push(line);
  }

  return tokens;
}

module.exports = lexer;
