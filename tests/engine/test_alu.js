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

console.log('tests/engine/test_alu.js: all assertions passed');