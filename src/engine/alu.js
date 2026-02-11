/**
 * Role 1: Engine Architect - ALU Module
 * Handles arithmetic and logical operations + Flag updates
 */
import { FLAGS } from './registers.js';

export class ALU {
    constructor(registers) {
        this.registers = registers;
    }

    /**
     * Standard 16-bit Addition
     * Sets: ZF, SF, CF, OF, AF, PF
     */
    add16(val1, val2) {
        const result = (val1 + val2) & 0xFFFF;
        
        // Update Zero Flag
        this.registers.setFlag(FLAGS.ZF, result === 0);
        
        // Update Sign Flag (MSB is 1)
        this.registers.setFlag(FLAGS.SF, (result & 0x8000) !== 0);
        
        // Update Carry Flag (Result exceeded 16 bits)
        this.registers.setFlag(FLAGS.CF, (val1 + val2) > 0xFFFF);

        // TODO: Implement OF, AF, PF logic for full accuracy
        return result;
    }

    sub16(val1, val2) {
        const result = (val1 - val2) & 0xFFFF;
        this.registers.setFlag(FLAGS.ZF, result === 0);
        this.registers.setFlag(FLAGS.SF, (result & 0x8000) !== 0);
        this.registers.setFlag(FLAGS.CF, val1 < val2); // Borrow
        return result;
    }
}