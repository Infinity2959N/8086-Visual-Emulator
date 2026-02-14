const assemble = require("./assembler");
const { toHexString } = require("./utils");

/**
 * Main entry point for the Assembler module.
 * @param {string} source - The raw assembly text.
 * @returns {object} - Contains the machineCode (Uint8Array) and symbolTable.
 */
function runAssembler(source) {
  try {
    const result = assemble(source);
    
    // Add a formatted string for the UI person (Role 3)
    result.hexString = toHexString(result.machineCode); 
    
    return result;
  } catch (error) {
    throw new Error(`Assembly Error: ${error.message}`);
  }
}

module.exports = runAssembler;