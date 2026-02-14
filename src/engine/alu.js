/**
 * Role 1: Engine Architect - ALU Module
 * Handles arithmetic, logical operations, and Flag updates.
 * 
 * Implemented Instructions:
 * - Arithmetic: ADD, SUB, INC, DEC, CMP, MUL, DIV, IMUL, IDIV, NEG
 * - Logical: AND, OR, XOR, NOT, TEST
 * - Shifts: SHL, SHR
 * - Rotates: ROL, ROR
 * 
 * TODO [R1-D]: Implement SAR (Shift Arithmetic Right - preserves sign bit)
 * TODO [R1-D]: Implement RCL/RCR (Rotate through Carry)
 * TODO [R1-D]: Implement Parity Flag (PF) calculation in _updateLogicalFlags
 * TODO [R1-D]: Implement OF, AF, PF flag updates for ADD/SUB operations
 * TODO [R1-D]: Implement OF for NEG (Overflow if negating 0x8000)
 * TODO [R1-D]: Implement Signed Math (IMUL/IDIV)
 * TODO [R1-D]: Implement Bitwise Rotates (ROL/ROR)
 * TODO [R1-D]: Implement Bitwise Shifts (SHL/SHR)
 */
import { FLAGS } from './registers.js';

export class ALU {
    constructor(registers) {
        this.registers = registers;
    }

    // ==========================================
    // ARITHMETIC GROUP
    // ==========================================

    /**
     * Standard 16-bit Addition
     * Sets: ZF, SF, CF, AF, OF, PF
     */
    add16(val1, val2) {
        const full = (val1 + val2) >>> 0;
        const result = full & 0xFFFF;

        // Zero / Sign
        this.registers.setFlag(FLAGS.ZF, result === 0);
        this.registers.setFlag(FLAGS.SF, (result & 0x8000) !== 0);

        // Carry (unsigned)
        this.registers.setFlag(FLAGS.CF, full > 0xFFFF);

        // Auxiliary carry (nibble)
        const af = ((val1 & 0xF) + (val2 & 0xF)) > 0xF;
        this.registers.setFlag(FLAGS.AF, af);

        // Overflow (signed): true when sign of result differs from operands when operands had same sign
        const of = (((val1 ^ result) & (val2 ^ result)) & 0x8000) !== 0;
        this.registers.setFlag(FLAGS.OF, of);

        // Parity (low byte) - PF = 1 if even number of 1 bits in least-significant byte
        const byte = result & 0xFF;
        let cnt = 0;
        for (let i = 0; i < 8; i++) { if (byte & (1 << i)) cnt++; }
        this.registers.setFlag(FLAGS.PF, (cnt % 2) === 0);

        return result;
    }

    /**
     * Standard 16-bit Subtraction
     * Sets: ZF, SF, CF (Borrow), AF, OF, PF
     */
    sub16(val1, val2) {
        const full = (val1 - val2) | 0; // allow signed-like JS behavior but keep low 16 bits for result
        const result = full & 0xFFFF;

        // Zero / Sign
        this.registers.setFlag(FLAGS.ZF, result === 0);
        this.registers.setFlag(FLAGS.SF, (result & 0x8000) !== 0);

        // Carry/Borrow for subtraction
        this.registers.setFlag(FLAGS.CF, (val1 >>> 0) < (val2 >>> 0));

        // Auxiliary borrow from bit 4
        const af = (val1 & 0xF) < (val2 & 0xF);
        this.registers.setFlag(FLAGS.AF, af);

        // Overflow (signed): when signs of operands differ and sign of result differs from sign of val1
        const of = (((val1 ^ val2) & (val1 ^ result)) & 0x8000) !== 0;
        this.registers.setFlag(FLAGS.OF, of);

        // Parity
        const byte = result & 0xFF;
        let cnt = 0;
        for (let i = 0; i < 8; i++) { if (byte & (1 << i)) cnt++; }
        this.registers.setFlag(FLAGS.PF, (cnt % 2) === 0);

        return result;
    }

    /**
     * Unsigned 16-bit Multiply (Implicit AX)
     * Output: DX:AX. Sets: CF, OF if result > 16-bit
     */
    mul16(multiplier) {
        const ax = this.registers.get16('AX');
        const result = ax * multiplier;
        const lowWord = result & 0xFFFF;
        const highWord = (result >>> 16) & 0xFFFF;

        this.registers.set16('AX', lowWord);
        this.registers.set16('DX', highWord);

        const hasCarry = highWord !== 0;
        this.registers.setFlag(FLAGS.CF, hasCarry);
        this.registers.setFlag(FLAGS.OF, hasCarry);
    }

    /**
     * Unsigned 16-bit Division (Implicit DX:AX)
     * Output: AX (Quotient), DX (Remainder)
     */
    div16(divisor) {
        if (divisor === 0) {
            this.registers.triggerInterrupt(0);
            return;
        }
        const dx = this.registers.get16('DX');
        const ax = this.registers.get16('AX');
        const dividend = ((dx << 16) >>> 0) | ax; // Ensure unsigned 32-bit

        const quotient = Math.floor(dividend / divisor);
        const remainder = dividend % divisor;

        if (quotient > 0xFFFF) {
            throw new Error("Division Overflow");
        }

        this.registers.set16('AX', quotient);
        this.registers.set16('DX', remainder);
    }

    inc16(val) {
        const result = (val + 1) & 0xFFFF;
        this.registers.setFlag(FLAGS.ZF, result === 0);
        this.registers.setFlag(FLAGS.SF, (result & 0x8000) !== 0);
        // INC does not affect CF, but affects OF/AF/PF
        this.registers.setFlag(FLAGS.OF, val === 0x7FFF);
        this.registers.setFlag(FLAGS.AF, ((val & 0xF) + 1) > 0xF);
        // Parity
        const byte = result & 0xFF; let cnt = 0; for (let i = 0; i < 8; i++) { if (byte & (1 << i)) cnt++; }
        this.registers.setFlag(FLAGS.PF, (cnt % 2) === 0);
        return result;
    }

    dec16(val) {
        const result = (val - 1) & 0xFFFF;
        this.registers.setFlag(FLAGS.ZF, result === 0);
        this.registers.setFlag(FLAGS.SF, (result & 0x8000) !== 0);
        // DEC does not affect CF, but affects OF/AF/PF
        this.registers.setFlag(FLAGS.OF, val === 0x8000);
        this.registers.setFlag(FLAGS.AF, (val & 0xF) === 0);
        const byte = result & 0xFF; let cnt = 0; for (let i = 0; i < 8; i++) { if (byte & (1 << i)) cnt++; }
        this.registers.setFlag(FLAGS.PF, (cnt % 2) === 0);
        return result;
    }

    cmp16(val1, val2) {
        this.sub16(val1, val2); // Result discarded, flags kept
    }

    /**
     * Two's Complement Negation
     * Logic: result = 0 - val. 
     * Flags: CF is 1 unless operand is 0. Updates ZF, SF, OF, PF, AF.
     */
    neg16(val) {
        const result = (0 - val) & 0xFFFF;
        this.registers.setFlag(FLAGS.CF, val !== 0);
        this.registers.setFlag(FLAGS.ZF, result === 0);
        this.registers.setFlag(FLAGS.SF, (result & 0x8000) !== 0);
        // AF: borrow from bit 4 when low nibble != 0
        this.registers.setFlag(FLAGS.AF, (val & 0xF) !== 0);
        // OF: overflow when negating 0x8000
        this.registers.setFlag(FLAGS.OF, val === 0x8000);
        // Parity
        const byte = result & 0xFF; let cnt = 0; for (let i = 0; i < 8; i++) { if (byte & (1 << i)) cnt++; }
        this.registers.setFlag(FLAGS.PF, (cnt % 2) === 0);
        return result;
    }

    /**
     * Signed 16-bit Multiply
     * Implicit: AX. Result in DX:AX.
     */
    imul16(multiplier) {
        // Convert unsigned 16-bit to signed JS numbers
        const ax = (this.registers.get16('AX') << 16) >> 16;
        const m = (multiplier << 16) >> 16;
        const result = ax * m;
        
        this.registers.set16('AX', result & 0xFFFF);
        this.registers.set16('DX', (result >> 16) & 0xFFFF);
        
        // CF/OF set if result doesn't fit in AX
        const fits = (result === ((result << 16) >> 16));
        this.registers.setFlag(FLAGS.CF, !fits);
        this.registers.setFlag(FLAGS.OF, !fits);
    }

    /**
     * Signed 16-bit Division
     * Implicit: DX:AX / operand. 
     */
    idiv16(divisor) {
        if (divisor === 0) {
            this.registers.triggerInterrupt(0);
            return;
        }
        const dx = this.registers.get16('DX');
        const ax = this.registers.get16('AX');
        const dividend = (dx << 16) | ax; // Signed 32-bit
        
        const d = (divisor << 16) >> 16; // Signed 16-bit
        const quotient = Math.trunc(dividend / d);
        const remainder = dividend % d;

        if (quotient > 32767 || quotient < -32768) {
            this.registers.triggerInterrupt(0); // Divide error
            return;
        }

        this.registers.set16('AX', quotient & 0xFFFF);
        this.registers.set16('DX', remainder & 0xFFFF);
    }

    // ==========================================
    // LOGICAL GROUP
    // ==========================================

    and16(val1, val2) {
        const result = (val1 & val2) & 0xFFFF;
        this._updateLogicalFlags(result);
        return result;
    }

    or16(val1, val2) {
        const result = (val1 | val2) & 0xFFFF;
        this._updateLogicalFlags(result);
        return result;
    }

    xor16(val1, val2) {
        const result = (val1 ^ val2) & 0xFFFF;
        this._updateLogicalFlags(result);
        return result;
    }

    test16(val1, val2) {
        const result = (val1 & val2) & 0xFFFF;
        this._updateLogicalFlags(result);
    }

    /**
     * Note: 8086 spec states NOT does NOT affect any flags.
     */
    not16(val) {
        return (~val) & 0xFFFF;
    }

    /**
     * Shift Left (SHL / SAL)
     * Sets: CF (last bit out), ZF, SF. 
     */
    shl16(val, count) {
        if (count === 0) return val;
        
        let result = val;
        let lastBitOut = 0;

        for (let i = 0; i < count; i++) {
            lastBitOut = (result & 0x8000) >> 15;
            result = (result << 1) & 0xFFFF;
        }

        this.registers.setFlag(FLAGS.CF, lastBitOut === 1);
        this._updateLogicalFlags(result);
        return result;
    }

    /**
     * Shift Right (SHR)
     * Sets: CF (last bit out), ZF, SF.
     */
    shr16(val, count) {
        if (count === 0) return val;

        let result = val;
        let lastBitOut = 0;

        for (let i = 0; i < count; i++) {
            lastBitOut = result & 0x0001;
            result = (result >>> 1) & 0xFFFF;
        }

        this.registers.setFlag(FLAGS.CF, lastBitOut === 1);
        this._updateLogicalFlags(result);
        return result;
    }

    /**
     * Arithmetic Shift Right (SAR)
     * Preserves sign bit; sets CF to last bit shifted out and clears OF.
     */
    sar16(val, count) {
        if (count === 0) return val & 0xFFFF;
        // Work with signed 32-bit to preserve sign while shifting
        let result = (val << 16) >> 16; // sign-extend to 32-bit signed
        let lastBitOut = 0;
        for (let i = 0; i < count; i++) {
            lastBitOut = result & 0x0001;
            result = result >> 1; // arithmetic shift
        }
        result = result & 0xFFFF;
        this.registers.setFlag(FLAGS.CF, lastBitOut === 1);
        this.registers.setFlag(FLAGS.OF, 0);
        this._updateLogicalFlags(result);
        return result;
    }

    /**
     * Rotate Left (ROL)
     * Sets: CF (contains the bit that rotated around)
     */
    rol16(val, count) {
        let result = val;
        for (let i = 0; i < count; i++) {
            const msb = (result & 0x8000) >> 15;
            result = ((result << 1) | msb) & 0xFFFF;
            this.registers.setFlag(FLAGS.CF, msb === 1);
        }
        return result;
    }

    /**
     * Rotate Right (ROR)
     * Sets: CF (contains the bit that rotated around)
     */
    ror16(val, count) {
        let result = val;
        for (let i = 0; i < count; i++) {
            const lsb = result & 0x0001;
            result = ((result >>> 1) | (lsb << 15)) & 0xFFFF;
            this.registers.setFlag(FLAGS.CF, lsb === 1);
        }
        return result;
    }

    // ==========================================
    // INTERNAL HELPERS
    // ==========================================

    _updateLogicalFlags(result) {
        this.registers.setFlag(FLAGS.ZF, result === 0);
        this.registers.setFlag(FLAGS.SF, (result & 0x8000) !== 0);
        // Parity flag (PF) - set when least-significant byte has even number of 1 bits
        const byte = result & 0xFF;
        let cnt = 0;
        for (let i = 0; i < 8; i++) { if (byte & (1 << i)) cnt++; }
        this.registers.setFlag(FLAGS.PF, (cnt % 2) === 0);
        // Leave CF/OF unchanged here; callers that need to set them should do so explicitly.
    }
}