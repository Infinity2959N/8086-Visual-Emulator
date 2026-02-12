/**
 * Role 1: Engine Architect - ALU Module
 * Handles arithmetic, logical operations, and Flag updates.
 * * TODO [R1-D]: Implement Signed Math (IMUL/IDIV)
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
     * Sets: ZF, SF, CF. TODO: Implement OF, AF, PF
     */
    add16(val1, val2) {
        const result = (val1 + val2) & 0xFFFF;
        this.registers.setFlag(FLAGS.ZF, result === 0);
        this.registers.setFlag(FLAGS.SF, (result & 0x8000) !== 0);
        this.registers.setFlag(FLAGS.CF, (val1 + val2) > 0xFFFF);
        return result;
    }

    /**
     * Standard 16-bit Subtraction
     * Sets: ZF, SF, CF (Borrow)
     */
    sub16(val1, val2) {
        const result = (val1 - val2) & 0xFFFF;
        this.registers.setFlag(FLAGS.ZF, result === 0);
        this.registers.setFlag(FLAGS.SF, (result & 0x8000) !== 0);
        this.registers.setFlag(FLAGS.CF, val1 < val2);
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
        // CF not affected by INC
        return result;
    }

    dec16(val) {
        const result = (val - 1) & 0xFFFF;
        this.registers.setFlag(FLAGS.ZF, result === 0);
        this.registers.setFlag(FLAGS.SF, (result & 0x8000) !== 0);
        // CF not affected by DEC
        return result;
    }

    cmp16(val1, val2) {
        this.sub16(val1, val2); // Result discarded, flags kept
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
     * TODO: Implement NOT (Bitwise inversion)
     * Note: NOT does NOT affect any flags.
     */

    // ==========================================
    // INTERNAL HELPERS
    // ==========================================

    _updateLogicalFlags(result) {
        this.registers.setFlag(FLAGS.ZF, result === 0);
        this.registers.setFlag(FLAGS.SF, (result & 0x8000) !== 0);
        this.registers.setFlag(FLAGS.CF, 0); 
        this.registers.setFlag(FLAGS.OF, 0); 
    }
}