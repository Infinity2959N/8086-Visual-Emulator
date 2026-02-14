import assert from 'node:assert';
import { Registers, FLAGS } from '../../src/engine/registers.js';
import { ALU } from '../../src/engine/alu.js';

const regs = new Registers();
const alu = new ALU(regs);

// add16 basic
assert.strictEqual(alu.add16(1, 2), 3, 'add16 basic');
assert.strictEqual(regs.getFlag(FLAGS.ZF), 0, 'ZF should be 0 for 1+2');

// add16 overflow
const r1 = alu.add16(0xFFFF, 1);
assert.strictEqual(r1, 0x0000, 'add16 overflow wraps');
assert.strictEqual(regs.getFlag(FLAGS.ZF), 1, 'ZF set on zero result');
assert.strictEqual(regs.getFlag(FLAGS.CF), 1, 'CF set on carry out');

// sub16
const r2 = alu.sub16(1, 1);
assert.strictEqual(r2, 0x0000, 'sub16 equal -> zero');
assert.strictEqual(regs.getFlag(FLAGS.ZF), 1, 'ZF set on zero');

const r3 = alu.sub16(0, 1);
assert.strictEqual(r3, 0xFFFF, 'sub16 borrow wraps');
assert.strictEqual(regs.getFlag(FLAGS.CF), 1, 'CF set on borrow');

// mul16 (uses AX implicitly)
regs.set16('AX', 0x1234);
alu.mul16(2);
assert.strictEqual(regs.get16('AX'), (0x1234 * 2) & 0xFFFF, 'mul16 low word');
assert.strictEqual(regs.get16('DX'), ((0x1234 * 2) >>> 16) & 0xFFFF, 'mul16 high word');

// div16 (DX:AX / operand)
regs.set16('DX', 0);
regs.set16('AX', 10);
alu.div16(2);
assert.strictEqual(regs.get16('AX'), 5, 'div16 quotient');
assert.strictEqual(regs.get16('DX'), 0, 'div16 remainder');

// shl16 and CF/ZF
const sh = alu.shl16(0x8000, 1);
assert.strictEqual(sh, 0x0000, 'shl16 wraps');
assert.strictEqual(regs.getFlag(FLAGS.CF), 1, 'CF set on shift-out');
assert.strictEqual(regs.getFlag(FLAGS.ZF), 1, 'ZF set when result is zero');

// not16
assert.strictEqual(alu.not16(0x00FF), 0xFF00, 'not16 inverts bits');

// Parity flag (PF) - low byte parity
alu.xor16(0x0003, 0x0000); // 0x03 has two bits set -> even
assert.strictEqual(regs.getFlag(FLAGS.PF), 1, 'PF even parity for 0x03');
alu.xor16(0x0001, 0x0000); // 0x01 has one bit set -> odd
assert.strictEqual(regs.getFlag(FLAGS.PF), 0, 'PF odd parity for 0x01');

// add16 OF/AF
regs.set16('FLAGS', 0);
alu.add16(0x7FFF, 1);
assert.strictEqual(regs.getFlag(FLAGS.OF), 1, 'OF set on signed overflow for add16');
assert.strictEqual(regs.getFlag(FLAGS.AF), 1, 'AF set on nibble carry for add16');

// sub16 OF/AF
regs.set16('FLAGS', 0);
alu.sub16(0x8000, 1);
assert.strictEqual(regs.getFlag(FLAGS.OF), 1, 'OF set on signed overflow for sub16');
assert.strictEqual(regs.getFlag(FLAGS.AF), 1, 'AF set on borrow for sub16');

// neg16 OF
regs.set16('FLAGS', 0);
alu.neg16(0x8000);
assert.strictEqual(regs.getFlag(FLAGS.OF), 1, 'OF set when negating 0x8000');

// INC/DEC affect OF as expected
regs.set16('FLAGS', 0);
alu.inc16(0x7FFF);
assert.strictEqual(regs.getFlag(FLAGS.OF), 1, 'INC sets OF on overflow');
regs.set16('FLAGS', 0);
alu.dec16(0x8000);
assert.strictEqual(regs.getFlag(FLAGS.OF), 1, 'DEC sets OF on overflow');

// SAR (arithmetic shift right)
const sar1 = alu.sar16(0x8001, 1);
assert.strictEqual(sar1, 0xC000, 'sar16 preserves sign');
assert.strictEqual(regs.getFlag(FLAGS.CF), 1, 'CF set on SAR shift-out');

// RCL/RCR (rotate through carry)
regs.setFlag(FLAGS.CF, 1);
const rcl1 = alu.rcl16(0x0001, 1); // 0x0001 << 1 | CF(1) = 0x0003
assert.strictEqual(rcl1, 0x0003, 'rcl16 rotates through carry');
assert.strictEqual(regs.getFlag(FLAGS.CF), 0, 'CF updated by RCL');

regs.setFlag(FLAGS.CF, 1);
const rcr1 = alu.rcr16(0x0002, 1); // 0x0002 >> 1 | CF(1) << 15 = 0x8001
assert.strictEqual(rcr1, 0x8001, 'rcr16 rotates through carry');
assert.strictEqual(regs.getFlag(FLAGS.CF), 0, 'CF updated by RCR');

console.log('tests/engine/test_alu.js: all assertions passed');