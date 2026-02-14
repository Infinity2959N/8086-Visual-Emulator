// utils.js
const registers = require("./registers");

function isRegister(op) {
  return registers.hasOwnProperty(op.toUpperCase());
}

function isImmediate(op) {
  return /^-?\d+$/.test(op) || /^0X[0-9A-F]+$/i.test(op); // Added Hex support
}

function toLittleEndian16(value) {
  return [value & 0xFF, (value >> 8) & 0xFF];
}

// NEW: For UI display (e.g., "B8 01 00")
function toHexString(byteArray) {
  return Array.from(byteArray)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

module.exports = {
  isRegister,
  isImmediate,
  toLittleEndian16,
  toHexString
};