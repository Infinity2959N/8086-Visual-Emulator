// Builds ModR/M byte for register-to-register operations

function buildModRM(regField, rmField) {
  const mod = 0b11; // register mode

  const modrm =
    (mod << 6) |
    (regField << 3) |
    rmField;

  return modrm;
}

module.exports = buildModRM;
