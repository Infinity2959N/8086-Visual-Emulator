/**
 * 8086 CPU Emulator
 * 
 * Currently Implemented Instructions:
 * - Data Transfer: MOV (reg16,imm16 / reg16,mem16), PUSH (reg16), POP (reg16), XCHG (reg16,reg16 / reg16,mem16), LEA (reg16,mem16)
 * - Arithmetic: ADD (AX,imm16), SUB (AX,imm16), INC (reg16), DEC (reg16), CMP (AX,imm16), MUL/IMUL/DIV/IDIV (mem/reg16), NEG (mem/reg16)
 * - Logical: AND/OR/XOR (AX,imm16), NOT (mem/reg16), TEST (mem/reg16,imm16)
 * - Shifts/Rotates: SHL, SHR, SAR, ROL, ROR, RCL, RCR (mem/reg16, 1 or CL)
 * - Control Flow: JZ/JE, JNZ/JNE, JC, JNC, CALL (rel16), RET
 * - System: NOP, HLT, CLC, STC, CMC
 * 
 * TODO: Missing instruction opcodes for the following planned instructions:
 * - Data Transfer: MOV (additional variants: mem,reg / reg,mem with different ModR/M modes)
 * - Arithmetic: ADD/SUB/CMP (additional ModR/M forms)
 * - Logical: AND/OR/XOR (additional ModR/M forms)
 * - String Operations: MOVSB, LODSB, STOSB, CMPSB
 * - Control Flow: JMP (unconditional), more conditional jumps
 */
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

    /**
     * Addressing Mode Resolver
     * Translates ModR/M bits into a 16-bit Memory Offset.
     * Ref: Ticket [R1-B]
     */
    resolveEffectiveAddress(mod, rm) {
        let ea = 0;
        let defaultSegment = 'DS'; // Default for most modes

        switch (rm) {
            case 0: ea = this.registers.get16('BX') + this.registers.get16('SI'); break;
            case 1: ea = this.registers.get16('BX') + this.registers.get16('DI'); break;
            case 2: 
                ea = this.registers.get16('BP') + this.registers.get16('SI'); 
                defaultSegment = 'SS'; // BP Rule applied
                break;
            case 3: 
                ea = this.registers.get16('BP') + this.registers.get16('DI'); 
                defaultSegment = 'SS'; // BP Rule applied
                break;
            case 4: ea = this.registers.get16('SI'); break;
            case 5: ea = this.registers.get16('DI'); break;
            case 6: 
                if (mod === 0) {
                    ea = this.fetchWord(); 
                } else {
                    ea = this.registers.get16('BP'); 
                    defaultSegment = 'SS'; // BP Rule applied
                }
                break;
            case 7: ea = this.registers.get16('BX'); break;
        }

        if (mod === 1) {
            ea += (this.fetchByte() << 24) >> 24; 
        } else if (mod === 2) {
            ea += this.fetchWord();
        }

        return { offset: ea & 0xFFFF, segment: defaultSegment };
    }

    /*
    * Stack Operations (PUSH/POP)
    * Ref: Ticket [R1-C]
    */
    push16(value) {
        let sp = this.registers.get16('SP');
        let ss = this.registers.get16('SS');
        
        // Decrement SP by 2 before writing (Stack grows downward)
        sp = (sp - 2) & 0xFFFF;
        this.registers.set16('SP', sp);
        
        // Write the 16-bit word (Little Endian)
        this.memory.writeByte(ss, sp, value & 0xFF);
        this.memory.writeByte(ss, sp + 1, (value >> 8) & 0xFF);
    }

    pop16() {
        let sp = this.registers.get16('SP');
        let ss = this.registers.get16('SS');
        
        // Read the 16-bit word (Little Endian)
        const low = this.memory.readByte(ss, sp);
        const high = this.memory.readByte(ss, sp + 1);
        const value = (high << 8) | low;
        
        // Increment SP by 2 after reading
        this.registers.set16('SP', (sp + 2) & 0xFFFF);
        
        return value;
    }

    /**
    * Internal helper to write 16-bit results back to either Register or Memory
    */
    _writeBack16(mod, rm, regName, offset, segment, value) {
        if (mod === 3) {
            this.registers.set16(regName, value);
        } else {
            const segVal = this.registers.get16(segment);
            this.memory.writeByte(segVal, offset, value & 0xFF);
            this.memory.writeByte(segVal, offset + 1, (value >> 8) & 0xFF);
        }
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

            // SUB AX, imm16 (Opcode 0x2D)
            case 0x2D: {
                const val1 = this.registers.get16('AX');
                const val2 = this.fetchWord();
                const res = this.alu.sub16(val1, val2);
                this.registers.set16('AX', res);
                break;
            }

            // CMP AX, imm16 (Opcode 0x3D) - sets flags only
            case 0x3D: {
                const imm = this.fetchWord();
                this.alu.cmp16(this.registers.get16('AX'), imm);
                break;
            }

            // AND AX, imm16 (Opcode 0x25)
            case 0x25: {
                const imm = this.fetchWord();
                const res = this.alu.and16(this.registers.get16('AX'), imm);
                this.registers.set16('AX', res);
                break;
            }

            // OR AX, imm16 (Opcode 0x0D)
            case 0x0D: {
                const imm = this.fetchWord();
                const res = this.alu.or16(this.registers.get16('AX'), imm);
                this.registers.set16('AX', res);
                break;
            }

            // XOR AX, imm16 (Opcode 0x35)
            case 0x35: {
                const imm = this.fetchWord();
                const res = this.alu.xor16(this.registers.get16('AX'), imm);
                this.registers.set16('AX', res);
                break;
            }

            // INC reg16 (Opcodes 0x40 - 0x47)
            case 0x40: case 0x41: case 0x42: case 0x43:
            case 0x44: case 0x45: case 0x46: case 0x47: {
                const regIndex = opcode - 0x40;
                const regNames = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'];
                const name = regNames[regIndex];
                const newVal = this.alu.inc16(this.registers.get16(name));
                this.registers.set16(name, newVal);
                break;
            }

            // DEC reg16 (Opcodes 0x48 - 0x4F)
            case 0x48: case 0x49: case 0x4A: case 0x4B:
            case 0x4C: case 0x4D: case 0x4E: case 0x4F: {
                const regIndex = opcode - 0x48;
                const regNames = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'];
                const name = regNames[regIndex];
                const newVal = this.alu.dec16(this.registers.get16(name));
                this.registers.set16(name, newVal);
                break;
            }

            // Shift/Rotate Group 2 (0xD0/0xD1 = shift by 1, 0xD2/0xD3 = shift by CL)
            case 0xD0: case 0xD1: case 0xD2: case 0xD3: {
                const modRM = this.fetchByte();
                const mod = (modRM >> 6) & 0x03;
                const extension = (modRM >> 3) & 0x07;
                const rm = modRM & 0x07;
                const regNames = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'];
                
                // Determine shift count
                let count;
                if (opcode === 0xD0 || opcode === 0xD1) {
                    count = 1;
                } else { // 0xD2 or 0xD3
                    count = this.registers.get8('CL');
                }
                
                // 16-bit operations only (0xD1/0xD3)
                const is16bit = (opcode === 0xD1 || opcode === 0xD3);
                if (!is16bit) {
                    console.error(`8-bit shift/rotate (${opcode.toString(16)}) not yet implemented`);
                    break;
                }
                
                let operand, offset, segment;
                
                // Fetch operand
                if (mod === 3) {
                    operand = this.registers.get16(regNames[rm]);
                } else {
                    const ea = this.resolveEffectiveAddress(mod, rm);
                    offset = ea.offset;
                    segment = ea.segment;
                    const segVal = this.registers.get16(segment);
                    const low = this.memory.readByte(segVal, offset);
                    const high = this.memory.readByte(segVal, offset + 1);
                    operand = (high << 8) | low;
                }
                
                let result;
                switch (extension) {
                    case 0: result = this.alu.rol16(operand, count); break; // ROL
                    case 1: result = this.alu.ror16(operand, count); break; // ROR
                    case 2: result = this.alu.rcl16(operand, count); break; // RCL
                    case 3: result = this.alu.rcr16(operand, count); break; // RCR
                    case 4: result = this.alu.shl16(operand, count); break; // SHL/SAL
                    case 5: result = this.alu.shr16(operand, count); break; // SHR
                    case 7: result = this.alu.sar16(operand, count); break; // SAR
                    default:
                        console.error(`Unsupported shift/rotate extension ${extension}`);
                        break;
                }
                
                // Write back
                if (result !== undefined) {
                    this._writeBack16(mod, rm, regNames[rm], offset, segment, result);
                }
                break;
            }

            // MUL/DIV (Grouped under opcode 0xF7)
            case 0xF7: { // Group 3: TEST, NOT, NEG, MUL, IMUL, DIV, IDIV (16-bit)
                const modRM = this.fetchByte();
                const mod = (modRM >> 6) & 0x03;
                const extension = (modRM >> 3) & 0x07;
                const rm = modRM & 0x07;

                const regNames = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'];
                let operand;
                let offset, segment; // For memory operations

                // 1. Fetch the operand (Register or Memory)
                if (mod === 3) {
                    operand = this.registers.get16(regNames[rm]);
                } else {
                    const ea = this.resolveEffectiveAddress(mod, rm);
                    offset = ea.offset;
                    segment = ea.segment;
                    const segVal = this.registers.get16(segment);
                    // Read 16-bit word from memory
                    const low = this.memory.readByte(segVal, offset);
                    const high = this.memory.readByte(segVal, offset + 1);
                    operand = (high << 8) | low;
                }

                // 2. Decode the sub-instruction via extension
                switch (extension) {
                    case 0: // TEST mem/reg, imm16
                        this.alu.test16(operand, this.fetchWord());
                        break;
                    case 2: // NOT mem/reg
                        const notRes = this.alu.not16(operand);
                        this._writeBack16(mod, rm, regNames[rm], offset, segment, notRes);
                        break;
                    case 3: // NEG mem/reg
                        const negRes = this.alu.neg16(operand);
                        this._writeBack16(mod, rm, regNames[rm], offset, segment, negRes);
                        break;
                    case 4: // MUL (Unsigned)
                        this.alu.mul16(operand);
                        break;
                    case 5: // IMUL (Signed)
                        this.alu.imul16(operand);
                        break;
                    case 6: // DIV (Unsigned)
                        this.alu.div16(operand);
                        break;
                    case 7: // IDIV (Signed)
                        this.alu.idiv16(operand);
                        break;
                    default:
                        console.error(`Undefined extension ${extension} for 0xF7`);
                        break;
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

            // MOV reg16, mem16 (Opcode 0x8B)
            case 0x8B: {
                const modRM = this.fetchByte();
                const mod = (modRM >> 6) & 0x03;
                const reg = (modRM >> 3) & 0x07;
                const rm = modRM & 0x07;

                const regNames = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'];
                const destReg = regNames[reg];

                if (mod === 3) {
                    // Register-to-Register move
                    this.registers.set16(destReg, this.registers.get16(regNames[rm]));
                } else {
                    // Memory-to-Register move
                    const { offset, segment } = this.resolveEffectiveAddress(mod, rm);
                    const segVal = this.registers.get16(segment);
                    const value = (this.memory.readByte(segVal, offset + 1) << 8) | this.memory.readByte(segVal, offset);
                    this.registers.set16(destReg, value);
                }
                break;
            }

            // PUSH reg16 (Opcodes 0x50 - 0x57)
            case 0x50: case 0x51: case 0x52: case 0x53:
            case 0x54: case 0x55: case 0x56: case 0x57: {
                const regIndex = opcode - 0x50;
                const regNames = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'];
                this.push16(this.registers.get16(regNames[regIndex]));
                break;
            }

            // POP reg16 (Opcodes 0x58 - 0x5F)
            case 0x58: case 0x59: case 0x5A: case 0x5B:
            case 0x5C: case 0x5D: case 0x5E: case 0x5F: {
                const regIndex = opcode - 0x58;
                const regNames = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'];
                this.registers.set16(regNames[regIndex], this.pop16());
                break;
            }

            case 0x8D: { // LEA reg16, mem16
                const modRM = this.fetchByte();
                const mod = (modRM >> 6) & 0x03;
                const reg = (modRM >> 3) & 0x07;
                const rm = modRM & 0x07;

                const regNames = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'];
                const destReg = regNames[reg];

                // LEA only works on memory, ignore mod 3 (register mode)
                if (mod !== 3) {
                    const { offset } = this.resolveEffectiveAddress(mod, rm);
                    this.registers.set16(destReg, offset); // We store the OFFSET, not the memory value
                }
                break;
            }

            case 0xE8: { // CALL rel16 (Near Call)
                const offset = this.fetchWord(); // Displacement
                const currentIP = this.registers.get16('IP');
                
                // 1. Push return address (current IP) to stack
                this.push16(currentIP);
                
                // 2. Jump to target: New IP = current IP + signed offset
                const signedOffset = (offset << 16) >> 16; 
                this.registers.set16('IP', (currentIP + signedOffset) & 0xFFFF);
                break;
            }

            case 0xC3: { // RET (Near Return)
                // 1. Pop the return address from the stack into IP
                const returnAddress = this.pop16();
                this.registers.set16('IP', returnAddress);
                break;
            }

            case 0x72: { // JC (Jump if Carry)
                const offset = this.fetchByte();
                if (this.registers.getFlag(FLAGS.CF) === 1) {
                    const signedOffset = (offset << 24) >> 24;
                    this.registers.set16('IP', (this.registers.get16('IP') + signedOffset) & 0xFFFF);
                }
                break;
            }

            case 0x73: { // JNC (Jump if Not Carry)
                const offset = this.fetchByte();
                if (this.registers.getFlag(FLAGS.CF) === 0) {
                    const signedOffset = (offset << 24) >> 24;
                    this.registers.set16('IP', (this.registers.get16('IP') + signedOffset) & 0xFFFF);
                }
                break;
            }

            case 0xF8: // CLC (Clear Carry Flag)
                this.registers.setFlag(FLAGS.CF, 0);
                break;

            case 0xF9: // STC (Set Carry Flag)
                this.registers.setFlag(FLAGS.CF, 1);
                break;

            case 0xF5: // CMC (Complement Carry Flag)
                const currentCF = this.registers.getFlag(FLAGS.CF);
                this.registers.setFlag(FLAGS.CF, currentCF === 0 ? 1 : 0);
                break;

            // Fast XCHG: AX with reg16 (0x91 to 0x97)
            // Note: 0x90 is XCHG AX, AX, which is technically NOP.
            case 0x91: case 0x92: case 0x93: case 0x94: case 0x95: case 0x96: case 0x97: {
                const regIndex = opcode - 0x90;
                const regNames = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'];
                const regName = regNames[regIndex];
                
                const valAX = this.registers.get16('AX');
                const valReg = this.registers.get16(regName);
                
                this.registers.set16('AX', valReg);
                this.registers.set16(regName, valAX);
                break;
            }

            // General XCHG: reg16 with mem/reg16
            case 0x87: {
                const modRM = this.fetchByte();
                const mod = (modRM >> 6) & 0x03;
                const reg = (modRM >> 3) & 0x07;
                const rm = modRM & 0x07;
                const regNames = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI'];
                
                const valReg = this.registers.get16(regNames[reg]);

                if (mod === 3) {
                    // Register-to-Register swap
                    const valRM = this.registers.get16(regNames[rm]);
                    this.registers.set16(regNames[reg], valRM);
                    this.registers.set16(regNames[rm], valReg);
                } else {
                    // Register-to-Memory swap
                    const { offset, segment } = this.resolveEffectiveAddress(mod, rm);
                    const ss = this.registers.get16(segment);
                    
                    // Read from memory
                    const low = this.memory.readByte(ss, offset);
                    const high = this.memory.readByte(ss, offset + 1);
                    const valMem = (high << 8) | low;
                    
                    // Write register value to memory
                    this.memory.writeByte(ss, offset, valReg & 0xFF);
                    this.memory.writeByte(ss, offset + 1, (valReg >> 8) & 0xFF);
                    
                    // Write memory value to register
                    this.registers.set16(regNames[reg], valMem);
                }
                break;
            }

            default:
                console.error(`Opcode 0x${opcode.toString(16)} not implemented.`);
                this.halted = true;
        }
    }
}