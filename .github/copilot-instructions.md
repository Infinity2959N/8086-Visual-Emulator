# GitHub Copilot Instructions for 8086 Visual Emulator

## Project Overview
This repository contains a visual emulator for the Intel 8086 processor. The project aims to provide an interactive and educational tool for understanding 8086 assembly language and processor operations.

## Technology Stack
- **Language**: JavaScript (ES2021+)
- **Environment**: Browser-based application
- **Linting**: ESLint with recommended rules
- **Node.js Version**: 18.x

## Project Structure
```
.
├── .github/
│   ├── workflows/        # CI/CD workflows
│   └── copilot-instructions.md
├── .eslintrc.json        # ESLint configuration
└── src/                  # Source code (to be created)
```

## Coding Standards and Conventions

### JavaScript Style Guide
- **ECMAScript Version**: ES2021 (latest)
- **Module System**: ES6 modules (`import`/`export`)
- **Code Quality**: Follow ESLint recommended rules
- **Equality Checks**: Always use strict equality (`===` and `!==`)
- **Console Usage**: Console statements are allowed (for debugging purposes)
- **Unused Variables**: Warn on unused variables but don't error

### Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for classes and constructors
- Use UPPER_CASE for constants
- Use descriptive names that reflect purpose

### Code Organization
- Keep functions focused and single-purpose
- Maintain clear separation of concerns
- Document complex algorithms and processor-specific logic
- Add comments for 8086-specific operations and opcodes

## Development Workflow

### Before Making Changes
1. Understand the 8086 processor architecture context
2. Review existing code patterns
3. Check ESLint configuration for style requirements

### Code Quality
- Run ESLint before committing: `npm run lint` or `npx eslint "src/**/*.js"`
- Fix linting errors with: `npm run lint -- --fix`
- All code should pass ESLint checks

### Testing Guidelines
- Write tests for new features when test infrastructure exists
- Test emulator functionality with various 8086 instructions
- Verify visual output and UI interactions
- Test edge cases and error handling

## 8086 Processor Context

### Key Concepts to Remember
- **Registers**: AX, BX, CX, DX (general purpose), SI, DI (index), BP, SP (stack), CS, DS, ES, SS (segment)
- **Addressing Modes**: Various addressing modes specific to 8086
- **Instruction Set**: Focus on accuracy of opcode implementation
- **Flags**: Carry, Zero, Sign, Overflow, Parity, Auxiliary carry
- **Memory Segmentation**: 20-bit addressing using segment:offset

### Implementation Guidelines
- Ensure accurate emulation of 8086 instruction behavior
- Handle all processor flags correctly
- Implement proper memory segmentation
- Support both 8-bit and 16-bit operations
- Handle edge cases in arithmetic operations (overflow, underflow)

## Best Practices for AI Assistance

### When Generating Code
- Prioritize clarity and educational value
- Add comments explaining 8086-specific behavior
- Follow the existing ESLint configuration
- Use modern JavaScript features (ES2021+)
- Ensure browser compatibility

### When Refactoring
- Maintain backward compatibility
- Preserve existing functionality
- Update related documentation
- Keep the visual interface intuitive

### When Adding Features
- Consider the educational purpose of the emulator
- Ensure features are well-documented
- Add appropriate error handling
- Consider performance implications for visual rendering

## Common Patterns

### Module Structure
```javascript
// Use ES6 modules
export class CPUEmulator {
  constructor() {
    // Initialize registers, memory, etc.
  }
}

export function executeInstruction(opcode) {
  // Implementation
}
```

### Error Handling
```javascript
// Validate inputs and provide clear error messages
if (!isValidOpcode(opcode)) {
  throw new Error(`Invalid 8086 opcode: ${opcode}`);
}
```

## Resources
- Intel 8086 Programmer's Reference Manual
- x86 Assembly Language Documentation
- ESLint Configuration: `.eslintrc.json`

## CI/CD
- Linting runs automatically on push and pull requests
- Ensure all checks pass before merging
- Check GitHub Actions for build status

## Questions?
For questions about the codebase or contribution guidelines, please open an issue or refer to the repository documentation.
