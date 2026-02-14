import assert from 'node:assert';
import { CPU } from '../../src/engine/cpu.js';
import { FLAGS } from '../../src/engine/registers.js';

const cpu = new CPU();

// MOV AX, imm16 (opcode 0xB8)
cpu.registers.set16('CS', 0);
cpu.registers.set16('IP', 0);
cpu.memory.writeByte(0, 0, 0xB8); // MOV AX, imm16
cpu.memory.writeByte(0, 1, 0x34); // low
cpu.memory.writeByte(0, 2, 0x12); // high -> 0x1234
cpu.step();
assert.strictEqual(cpu.registers.get16('AX'), 0x1234, 'MOV AX, imm16 executed');

// ADD AX, imm16 (opcode 0x05)
cpu.memory.writeByte(0, 3, 0x05); // ADD AX, imm16
cpu.memory.writeByte(0, 4, 0x01);
cpu.memory.writeByte(0, 5, 0x00); // add 1
cpu.step();
assert.strictEqual(cpu.registers.get16('AX'), 0x1235, 'ADD AX, imm16 executed');

// push16 / pop16 helpers
cpu.registers.set16('SP', 0xFFFE);
cpu.registers.set16('SS', 0);
cpu.push16(0xBEEF);
assert.strictEqual(cpu.registers.get16('SP'), 0xFFFC, 'SP decremented by 2');
const low = cpu.memory.readByte(0, 0xFFFC);
const high = cpu.memory.readByte(0, 0xFFFD);
assert.strictEqual((high << 8) | low, 0xBEEF, 'value written to stack');
const popped = cpu.pop16();
assert.strictEqual(popped, 0xBEEF, 'pop16 returns pushed value');
assert.strictEqual(cpu.registers.get16('SP'), 0xFFFE, 'SP restored after pop');

// SUB AX, imm16 (opcode 0x2D)
cpu.memory.writeByte(0, 6, 0x2D); // SUB AX, imm16
cpu.memory.writeByte(0, 7, 0x02);
cpu.memory.writeByte(0, 8, 0x00); // subtract 2
cpu.step();
assert.strictEqual(cpu.registers.get16('AX'), 0x1233, 'SUB AX, imm16 executed');

// CMP AX, imm16 (opcode 0x3D)
cpu.memory.writeByte(0, 9, 0x3D);
cpu.memory.writeByte(0, 10, 0x33);
cpu.memory.writeByte(0, 11, 0x12); // compare with 0x1233
cpu.step();
assert.strictEqual(cpu.registers.getFlag(FLAGS.ZF), 1, 'CMP AX, imm16 sets ZF on equality');

// INC CX (0x41) / DEC DX (0x4A)
cpu.registers.set16('CX', 0x7FFF);
cpu.memory.writeByte(0, 12, 0x41); // INC CX
cpu.step();
assert.strictEqual(cpu.registers.get16('CX'), 0x8000, 'INC CX executed');
assert.strictEqual(cpu.registers.getFlag(FLAGS.OF), 1, 'INC sets OF on overflow');

cpu.registers.set16('DX', 0x8000);
cpu.memory.writeByte(0, 13, 0x4A); // DEC DX
cpu.step();
assert.strictEqual(cpu.registers.get16('DX'), 0x7FFF, 'DEC DX executed');
assert.strictEqual(cpu.registers.getFlag(FLAGS.OF), 1, 'DEC sets OF on overflow');

// AND/OR/XOR AX, imm16
cpu.registers.set16('AX', 0x00FF);
cpu.memory.writeByte(0, 14, 0x25); // AND AX, imm16
cpu.memory.writeByte(0, 15, 0x0F);
cpu.memory.writeByte(0, 16, 0x00);
cpu.step();
assert.strictEqual(cpu.registers.get16('AX'), 0x000F, 'AND AX imm executed');

cpu.memory.writeByte(0, 17, 0x0D); // OR AX, imm16
cpu.memory.writeByte(0, 18, 0xF0);
cpu.memory.writeByte(0, 19, 0x00);
cpu.step();
assert.strictEqual(cpu.registers.get16('AX'), 0x00FF, 'OR AX imm executed');

cpu.memory.writeByte(0, 20, 0x35); // XOR AX, imm16
cpu.memory.writeByte(0, 21, 0xFF);
cpu.memory.writeByte(0, 22, 0x00);
cpu.step();
assert.strictEqual(cpu.registers.get16('AX'), 0x0000, 'XOR AX imm executed');

// Shift/Rotate via CPU opcodes (0xD1 = shift by 1, 0xD3 = shift by CL)
// ROL BX, 1 (0xD1 /0)
cpu.registers.set16('BX', 0x8001);
cpu.memory.writeByte(0, 23, 0xD1); // shift group
cpu.memory.writeByte(0, 24, 0xC3); // ModR/M: mod=3, ext=0 (ROL), rm=3 (BX)
cpu.step();
assert.strictEqual(cpu.registers.get16('BX'), 0x0003, 'ROL BX, 1 executed');
assert.strictEqual(cpu.registers.getFlag(FLAGS.CF), 1, 'CF set by ROL');

// SHL DX, CL (0xD3 /4) - use DX as target since we're setting CL
cpu.registers.set8('CL', 4);
cpu.registers.set16('DX', 0x0001);
cpu.memory.writeByte(0, 25, 0xD3); // shift by CL
cpu.memory.writeByte(0, 26, 0xE2); // ModR/M: mod=3, ext=4 (SHL), rm=2 (DX)
cpu.step();
assert.strictEqual(cpu.registers.get16('DX'), 0x0010, 'SHL DX, CL executed'); // 1 << 4 = 16 (0x10)

// SAR AX, 1 (0xD1 /7) - use AX since DX was used above
cpu.registers.set16('AX', 0x8000);
cpu.memory.writeByte(0, 27, 0xD1);
cpu.memory.writeByte(0, 28, 0xF8); // ModR/M: mod=3, ext=7 (SAR), rm=0 (AX)
cpu.step();
assert.strictEqual(cpu.registers.get16('AX'), 0xC000, 'SAR AX, 1 preserves sign');

console.log('tests/engine/test_cpu.js: all assertions passed');