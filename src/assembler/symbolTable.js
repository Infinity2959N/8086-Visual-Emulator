// symbolTable.js

import instructionMap from "./instructionMap.js";
import { isRegister, isImmediate } from "./utils.js";

function detectInstructionKey(mnemonic, operands = []) {
  if (operands.length === 2) {
    const [dest, src] = operands;

    if (isRegister(dest) && isRegister(src)) {
      return mnemonic + "_REG_REG";
    }

    if (isRegister(dest) && isImmediate(src)) {
      return mnemonic + "_REG_IMM";
    }
  }

  if (operands.length === 1 && isRegister(operands[0])) {
    return mnemonic + "_REG";
  }

  return mnemonic; // fallback (JMP, NOP, etc.)
}

export default function buildSymbolTable(parsedLines) {
  const symbolTable = {};
  let offset = 0;

  for (const line of parsedLines) {

    // Label detection
    if (line.label) {
      symbolTable[line.label] = offset;
    }

    if (!line.mnemonic) continue;

    const key = detectInstructionKey(line.mnemonic, line.operands);
    const entry = instructionMap[key];

    if (!entry) {
      throw new Error(`Unknown instruction form: ${key}`);
    }

    offset += entry.size;
  }

  return symbolTable;
}
