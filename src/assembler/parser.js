// parser.js
export default function parser(lines) {
  const parsed = [];

  for (let line of lines) {
    let label = null;
    let mnemonic = null;
    let operands = [];

    // 1. Handle Labels
    if (line.includes(":")) {
      const parts = line.split(":");
      label = parts[0].trim();
      line = parts[1] ? parts[1].trim() : "";
      
      if (line === "") {
        parsed.push({ label, mnemonic: null, operands: [] });
        continue;
      }
    }

    // 2. Handle Mnemonic and Operands using Regex for flexible spacing
    const match = line.match(/^(\w+)\s*(.*)$/);
    if (match) {
      mnemonic = match[1].toUpperCase();
      const operandPart = match[2];

      if (operandPart) {
        operands = operandPart
          .split(",")
          .map(op => op.trim())
          .filter(op => op.length > 0);
      }
    }

    parsed.push({ label, mnemonic, operands });
  }

  return parsed;
}