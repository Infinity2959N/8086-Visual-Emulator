const lexer = require("./lexer");
const parser = require("./parser");
const buildSymbolTable = require("./symbolTable");
const pass2 = require("./pass2");

function assemble(code) {

  const tokens = lexer(code);
  const parsed = parser(tokens);

  const symbolTable = buildSymbolTable(parsed);
  const machineCode = pass2(parsed, symbolTable);

  return { symbolTable, machineCode };
}

module.exports = assemble;
