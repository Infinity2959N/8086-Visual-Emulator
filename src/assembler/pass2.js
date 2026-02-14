// pass2.js
import instructionMap from "./instructionMap.js";
import registers from "./registers.js";
import { isRegister, isImmediate, toLittleEndian16 } from "./utils.js";

function buildModRM(reg, rm) {
  return (0b11 << 6) | (reg << 3) | rm;
}

function detectInstructionKey(mnemonic, operands = []) {
  if (operands.length === 2) {
    const [dest, src] = operands;
    if (isRegister(dest) && isRegister(src)) return mnemonic + "_REG_REG";
    if (isRegister(dest) && isImmediate(src)) return mnemonic + "_REG_IMM";
  }
  if (operands.length === 1 && isRegister(operands[0])) return mnemonic + "_REG";
  return mnemonic;
}

export default function pass2(parsedLines, symbolTable) {
  const machineCode = [];
  let currentOffset = 0;

  for (const line of parsedLines) {
    if (!line.mnemonic) continue;

    const { mnemonic, operands = [] } = line;
    const key = detectInstructionKey(mnemonic, operands);
    const entry = instructionMap[key];

    if (!entry) throw new Error(`Line ${currentOffset}: Unsupported instruction ${key}`);

    const opcode = entry.opcode;

    // --- Logic for REG_REG ---
    if (key.endsWith("_REG_REG")) {
      const modrm = buildModRM(registers[operands[1]], registers[operands[0]]);
      machineCode.push(opcode, modrm);
    } 
    // --- Logic for REG_IMM ---
    else if (key.endsWith("_REG_IMM")) {
      const val = parseInt(operands[1]);
      if (mnemonic === "MOV") {
        machineCode.push(opcode + registers[operands[0]]);
      } else {
        machineCode.push(opcode, buildModRM(entry.group, registers[operands[0]]));
      }
      machineCode.push(...toLittleEndian16(val));
    }
    // --- Logic for RELATIVE JUMPS ---
    else if (entry.relative) {
      const target = symbolTable[operands[0]];
      if (target === undefined) throw new Error(`Undefined label: ${operands[0]}`);

      const nextIP = currentOffset + entry.size;
      const relOffset = target - nextIP;

      machineCode.push(opcode);
      if (entry.size === 2) {
        // Range Check for 8-bit jump
        if (relOffset < -128 || relOffset > 127) {
          throw new Error(`Jump to ${operands[0]} is too far (${relOffset} bytes)`);
        }
        machineCode.push(relOffset & 0xFF);
      } else {
        machineCode.push(...toLittleEndian16(relOffset));
      }
    } 
    else {
      machineCode.push(opcode);
    }

    currentOffset += entry.size;
  }

  // Day 11 Requirement: Return as Uint8Array
  return new Uint8Array(machineCode);
}