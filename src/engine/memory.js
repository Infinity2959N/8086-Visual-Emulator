/**
 * Role 1: Engine Architect
 * 1MB Memory Space with 20-bit Wraparound Logic
 */
export class Memory {
    constructor() {
        // 1MB = 2^20 bytes
        this.data = new Uint8Array(1024 * 1024);
    }

    /**
     * Physical Address = (Segment * 16) + Offset
     * 20-bit Wraparound: Masking with 0xFFFFF ensures the address 
     * stays within 1MB boundaries, mimicking real 8086 hardware.
     */
    getPhysicalAddress(segment, offset) {
        const address = ((segment & 0xFFFF) << 4) + (offset & 0xFFFF);
        return address & 0xFFFFF; 
    }

    readByte(seg, off) {
        return this.data[this.getPhysicalAddress(seg, off)];
    }

    writeByte(seg, off, value) {
        this.data[this.getPhysicalAddress(seg, off)] = value & 0xFF;
    }
}