/**
 * Role 1: Engine Architect
 * Fundamental 8086 Register Set with Flag Logic
 */

// Flag bit positions based on standard 8086 specs
export const FLAGS = {
    CF: 0,  // Carry Flag
    PF: 2,  // Parity Flag
    AF: 4,  // Auxiliary Carry
    ZF: 6,  // Zero Flag
    SF: 7,  // Sign Flag
    TF: 8,  // Trap Flag
    IF: 9,  // Interrupt Enable
    DF: 10, // Direction Flag
    OF: 11  // Overflow Flag
};

export class Registers {
    constructor() {
        // 14 registers, 2 bytes each = 28 bytes
        this.buffer = new ArrayBuffer(28);
        this.view = new DataView(this.buffer);

        // Map names to byte offsets in the buffer
        this.map = {
            AX: 0, CX: 2, DX: 4, BX: 6,
            SP: 8, BP: 10, SI: 12, DI: 14,
            ES: 16, CS: 18, SS: 20, DS: 22,
            IP: 24, FLAGS: 26
        };
    }

    // 16-bit Access
    get16(name) { return this.view.getUint16(this.map[name.toUpperCase()], true); }
    set16(name, value) { this.view.setUint16(this.map[name.toUpperCase()], value & 0xFFFF, true); }

    // 8-bit Access (AL, AH, etc.)
    get8(name) {
        const reg = name.toUpperCase();
        const base = this.map[reg[0] + 'X'];
        const offset = reg[1] === 'L' ? 0 : 1;
        return this.view.getUint8(base + offset);
    }

    set8(name, value) {
        const reg = name.toUpperCase();
        const base = this.map[reg[0] + 'X'];
        const offset = reg[1] === 'L' ? 0 : 1;
        this.view.setUint8(base + offset, value & 0xFF);
    }

    // Flag Management Logic
    setFlag(flagBit, value) {
        let currentFlags = this.get16('FLAGS');
        if (value) {
            currentFlags |= (1 << flagBit);
        } else {
            currentFlags &= ~(1 << flagBit);
        }
        this.set16('FLAGS', currentFlags);
    }

    getFlag(flagBit) {
        return (this.get16('FLAGS') >> flagBit) & 1;
    }

    triggerInterrupt(type) {
        console.warn(`CPU TRAP: Interrupt Type ${type} triggered.`);
        // Realistic 8086 behavior:
        // 1. Push FLAGS to stack
        // 2. Push CS to stack
        // 3. Push IP to stack
        // 4. Load New IP from [type * 4] and New CS from [type * 4 + 2]
        
        // For our current version, we'll halt and notify the user.
        this.set16('IP', this.get16('IP') - 1); // Point back to the offending instruction
    }
}