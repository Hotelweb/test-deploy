---
inclusion: always
---

# Node.js Package Manager Standards

## Required Package Managers

**MANDATORY**: Use `pnpm` for all Node.js dependency management. Never use `npm` or `yarn`.

### Preferred Order

1. **pnpm** - Efficient disk usage, strict dependency resolution

### Installation Commands

```bash

# Using pnpm
pnpm install
pnpm add <package>
pnpm remove <package>
pnpm run <script>
```

### Project Detection

- If `pnpm-lock.yaml` exists, use `pnpm`
- Never generate `package-lock.json` or `yarn.lock`

### Script Execution

Always use the detected package manager for running scripts:

- `pnpm build` instead of `npm run build`

This ensures consistent dependency resolution and optimal performance across the project.
