import { CPU } from './engine/cpu.js';

const myCpu = new CPU();

// Manually "Assemble" a small test: 
// MOV AX, 0x0005 (B8 05 00)
// ADD AX, 0x0002 (05 02 00)
// HLT            (F4)
const program = new Uint8Array([0xB8, 0x05, 0x00, 0x05, 0x02, 0x00, 0xF4]);

// Load into memory at 0000:0000
for(let i = 0; i < program.length; i++) {
    myCpu.memory.data[i] = program[i];
}

console.log("Starting Execution...");
while(!myCpu.halted) {
    myCpu.step();
    console.log(`AX: ${myCpu.registers.get16('AX').toString(16).padStart(4, '0')}`);
}