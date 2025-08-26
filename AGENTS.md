# Agent Instructions

## Build/Lint/Test Commands

- Build: `pnpm build` (all packages) or `pnpm --filter <package> build`
- Lint: `pnpm lint` (all packages) or `pnpm --filter <package> lint`
- Test: `pnpm test` (all packages) or `pnpm --filter <package> test`
- Single test: `pnpm --filter <package> test <test-file>`
- Format: `pnpm format`

## Code Style

- TypeScript strict mode enabled
- Prettier formatting (semi:true, singleQuote:true, trailingComma:all)
- ES2020 target with ESNext modules
- Import paths: Use relative paths for local files, package imports for external
- Naming: camelCase for variables/functions, PascalCase for classes/types
- Types: Strict typing required, avoid 'any'
- Error handling: Prefer throwing Errors over returning null/undefined
- Exports: Use named exports over default exports

## Comments

- Use JSDoc style comments
- Use English for comments
- Provide Example