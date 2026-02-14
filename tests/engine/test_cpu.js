import assert from 'node:assert';
import { CPU } from '../../src/engine/cpu.js';

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

console.log('tests/engine/test_cpu.js: all assertions passed');