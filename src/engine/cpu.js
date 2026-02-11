import { Registers, FLAGS } from './registers.js';
import { Memory } from './memory.js';
import { ALU } from './alu.js';

export class CPU {
    constructor() {
        this.registers = new Registers();
        this.memory = new Memory();
        this.alu = new ALU(this.registers); // Link ALU to registers
        this.halted = false;

        // Initialize Segment Registers for testing
        this.registers.set16('CS', 0x0000);
        this.registers.set16('IP', 0x0000);
    }

    step() {
        if (this.halted) return;
        const opcode = this.fetchByte();
        this.execute(opcode);
    }

    fetchByte() {
        const cs = this.registers.get16('CS');
        const ip = this.registers.get16('IP');
        const byte = this.memory.readByte(cs, ip);
        this.registers.set16('IP', ip + 1);
        return byte;
    }

    fetchWord() {
        const low = this.fetchByte();
        const high = this.fetchByte();
        return (high << 8) | low;
    }

    execute(opcode) {
        switch (opcode) {
            case 0x90: break; // NOP
            case 0xF4: this.halted = true; break; // HLT

            // MOV reg16, imm16
            case 0xB8: case 0xB9: case 0xBA: case 0xBB:
            case 0xBC: case 0xBD: case 0xBE: case 0xBF: {
                const regIndex = opcode - 0xB8;
                const regNames = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'];
                this.registers.set16(regNames[regIndex], this.fetchWord());
                break;
            }

            // ADD AX, imm16 (Opcode 0x05)
            case 0x05: {
                const val1 = this.registers.get16('AX');
                const val2 = this.fetchWord();
                const res = this.alu.add16(val1, val2);
                this.registers.set16('AX', res);
                break;
            }

            // MUL/DIV (Grouped under opcode 0xF7)
            case 0xF7: {
                const modRM = this.fetchByte();
                const regIndex = modRM & 0x07; // Destination register bits
                const regNames = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'];
                const operand = this.registers.get16(regNames[regIndex]);

                // Bits 5-3 of ModR/M determine the actual sub-instruction
                const extension = (modRM >> 3) & 0x07;
                
                if (extension === 4) { // MUL
                    this.alu.mul16(operand);
                } else if (extension === 6) { // DIV
                    this.alu.div16(operand);
                }
                break;
            }

            case 0x74: { // JZ (Jump if Zero) - Short Jump (Rel8)
                const offset = this.fetchByte(); // 8-bit signed offset
                if (this.registers.getFlag(FLAGS.ZF) === 1) {
                    const currentIP = this.registers.get16('IP');
                    // Convert unsigned byte to signed 8-bit integer
                    const signedOffset = (offset << 24) >> 24;
                    this.registers.set16('IP', currentIP + signedOffset);
                }
                break;
            }

            case 0x75: { // JNZ (Jump if Not Zero)
                const offset = this.fetchByte();
                if (this.registers.getFlag(FLAGS.ZF) === 0) {
                    const currentIP = this.registers.get16('IP');
                    const signedOffset = (offset << 24) >> 24;
                    this.registers.set16('IP', currentIP + signedOffset);
                }
                break;
            }

            default:
                console.error(`Opcode 0x${opcode.toString(16)} not implemented.`);
                this.halted = true;
        }
    }
}