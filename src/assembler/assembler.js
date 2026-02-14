import lexer from "./lexer.js";
import parser from "./parser.js";
import buildSymbolTable from "./symbolTable.js";
import pass2 from "./pass2.js";

export default function assemble(code) {

  const tokens = lexer(code);
  const parsed = parser(tokens);

  const symbolTable = buildSymbolTable(parsed);
  const machineCode = pass2(parsed, symbolTable);

  return { symbolTable, machineCode };
}
