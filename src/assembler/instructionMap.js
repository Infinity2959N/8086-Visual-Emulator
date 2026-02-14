module.exports = {

  // =====================
  // DATA TRANSFER
  // =====================
  MOV_REG_REG: { opcode: 0x89, size: 2, modrm: true },
  MOV_REG_IMM: { opcode: 0xB8, size: 3, regOpcode: true },

  PUSH_REG: { opcode: 0x50, size: 1, regOpcode: true },
  POP_REG:  { opcode: 0x58, size: 1, regOpcode: true },

  XCHG_REG_REG: { opcode: 0x87, size: 2, modrm: true },
  LEA_REG_MEM:  { opcode: 0x8D, size: 2, modrm: true },

  // =====================
  // ARITHMETIC
  // =====================
  ADD_REG_REG: { opcode: 0x01, size: 2, modrm: true },
  ADD_REG_IMM: { opcode: 0x81, size: 4, group: 0 },  // /0

  SUB_REG_REG: { opcode: 0x29, size: 2, modrm: true },
  SUB_REG_IMM: { opcode: 0x81, size: 4, group: 5 },  // /5

  CMP_REG_REG: { opcode: 0x39, size: 2, modrm: true },
  CMP_REG_IMM: { opcode: 0x81, size: 4, group: 7 },  // /7

  INC_REG: { opcode: 0x40, size: 1, regOpcode: true },
  DEC_REG: { opcode: 0x48, size: 1, regOpcode: true },

  MUL_REG: { opcode: 0xF7, size: 2, group: 4 },  // /4
  DIV_REG: { opcode: 0xF7, size: 2, group: 6 },  // /6

  // =====================
  // LOGICAL
  // =====================
  AND_REG_REG:  { opcode: 0x21, size: 2, modrm: true },
  OR_REG_REG:   { opcode: 0x09, size: 2, modrm: true },
  XOR_REG_REG:  { opcode: 0x31, size: 2, modrm: true },
  TEST_REG_REG: { opcode: 0x85, size: 2, modrm: true },

  NOT_REG: { opcode: 0xF7, size: 2, group: 2 },  // /2

  // =====================
  // STRING OPERATIONS
  // =====================
  MOVSB: { opcode: 0xA4, size: 1 },
  LODSB: { opcode: 0xAC, size: 1 },
  STOSB: { opcode: 0xAA, size: 1 },
  CMPSB: { opcode: 0xA6, size: 1 },

  // =====================
  // CONTROL TRANSFER
  // =====================
  JMP:  { opcode: 0xE9, size: 3, relative: true },
  CALL: { opcode: 0xE8, size: 3, relative: true },
  RET:  { opcode: 0xC3, size: 1 },

  JE:  { opcode: 0x74, size: 2, relative: true },
  JZ:  { opcode: 0x74, size: 2, relative: true },
  JNE: { opcode: 0x75, size: 2, relative: true },
  JNZ: { opcode: 0x75, size: 2, relative: true },
  JC:  { opcode: 0x72, size: 2, relative: true },
  JNC: { opcode: 0x73, size: 2, relative: true },

  // =====================
  // ROTATE / SHIFT (Group 2)
  // =====================
  ROL: { opcode: 0xD1, size: 2, group: 0 },
  ROR: { opcode: 0xD1, size: 2, group: 1 },
  SHL: { opcode: 0xD1, size: 2, group: 4 },
  SHR: { opcode: 0xD1, size: 2, group: 5 },

  // =====================
  // PROCESSOR CONTROL
  // =====================
  NOP: { opcode: 0x90, size: 1 },
  HLT: { opcode: 0xF4, size: 1 },
  CLC: { opcode: 0xF8, size: 1 },
  STC: { opcode: 0xF9, size: 1 }

};
