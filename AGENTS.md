# Agent Instructions

## Project Overview

Fetcher is a modern, lightweight HTTP client library built on the native Fetch API with TypeScript-first design. It provides a complete ecosystem including core HTTP client, decorators for declarative APIs, React hooks, event streaming, and enterprise security integrations.

**Key Technologies**: TypeScript, React, Vite, Vitest, Storybook, Antd, pnpm workspaces

## Project Structure

```
packages/
├── fetcher/          # Core HTTP client library
├── decorator/        # Declarative API decorators
├── eventstream/      # Server-Sent Events & LLM streaming
├── eventbus/         # Cross-tab event communication
├── storage/          # Cross-environment storage
├── react/            # React hooks and components
├── wow/              # CQRS/DDD framework integration
├── cosec/            # Enterprise security (CoSec)
├── openapi/          # OpenAPI client generation
├── generator/        # Code generation utilities
└── viewer/           # API documentation viewer

stories/              # Storybook documentation
integration-test/     # End-to-end tests
scripts/              # Build and deployment scripts
```

## Development Workflow

### 1. Setup

```bash
pnpm install
pnpm init  # Initialize development environment
```

### 2. Development

```bash
pnpm storybook        # Start Storybook for documentation
pnpm --filter <package> dev  # Start development server for specific package
```

### 3. Quality Gates

- **Lint**: `pnpm lint` (ESLint with TypeScript support)
- **Test**: `pnpm test` (Vitest with coverage)
- **Build**: `pnpm build` (TypeScript compilation + bundling)
- **Format**: `pnpm format` (Prettier)

### 4. Commit Process

- Ensure all quality gates pass
- Use conventional commit messages
- Include tests for new features
- Update documentation as needed

## Build/Lint/Test Commands

- **Build**: `pnpm build` (all packages) or `pnpm --filter <package> build`
- **Lint**: `pnpm lint` (all packages) or `pnpm --filter <package> lint`
- **Test**: `pnpm test` (all packages) or `pnpm --filter <package> test`
- **Unit Tests**: `pnpm test:unit` (package tests only)
- **Integration Tests**: `pnpm test:it` (end-to-end tests)
- **Single Test**: `pnpm --filter <package> test <test-file>`
- **Format**: `pnpm format` (Prettier)
- **Storybook**: `pnpm storybook` (dev) / `pnpm build-storybook` (build)

## Code Style & Conventions

### TypeScript Configuration

- **Strict mode**: Enabled for all packages
- **Target**: ES2020 with ESNext modules
- **Module resolution**: Node with path mapping
- **Declaration files**: Generated automatically with `unplugin-dts`

### Naming Conventions

- **Variables/Functions**: camelCase (`fetchData`, `handleError`)
- **Classes/Types/Interfaces**: PascalCase (`HttpClient`, `ApiResponse`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`)
- **Files**: kebab-case (`http-client.ts`, `api-decorator.ts`)

### Import/Export Patterns

- **External packages**: Direct imports (`import { useState } from 'react'`)
- **Internal modules**: Relative paths (`import { Fetcher } from '../core/fetcher'`)
- **Barrel exports**: Use `index.ts` files for clean imports
- **Named exports**: Preferred over default exports
- **Type imports**: Separate type-only imports (`import type { User } from './types'`)

### Error Handling

- **Throw Errors**: Prefer throwing `Error` instances over returning `null/undefined`
- **Custom errors**: Create specific error classes when appropriate
- **Async operations**: Use proper try/catch with meaningful error messages
- **Validation**: Fail fast with descriptive validation errors

## Testing Guidelines

### Test Structure

```
src/
├── component.ts
├── component.test.ts     # Unit tests
└── stories/
    └── component.stories.tsx  # Storybook stories

integration-test/         # E2E tests
```

### Testing Patterns

- **Unit Tests**: Test individual functions/classes in isolation
- **Integration Tests**: Test component interactions and API calls
- **E2E Tests**: Full user workflows in `integration-test/`
- **Storybook Tests**: Visual and interaction testing

### Test Coverage

- **Target**: >80% coverage across all packages
- **Critical paths**: 100% coverage for core functionality
- **Generated code**: Excluded from coverage requirements

### Testing Tools

- **Framework**: Vitest with jsdom environment
- **Coverage**: v8 coverage provider
- **UI**: Vitest UI for interactive testing
- **Browser**: Playwright for E2E tests

## Documentation Guidelines

### Storybook Documentation

- **Location**: `stories/` directory with `.mdx` and `.stories.tsx` files
- **Framework**: Storybook 9.x with React + Vite
- **Components**: Prioritize Antd components over plain HTML
- **Structure**: Introduction → API Overview → Usage Guides

### MDX Best Practices

- **Single-line lists**: Keep list items on one line to avoid parsing issues
- **Antd components**: Use `Typography`, `Card`, `List`, `Descriptions` over HTML
- **Code examples**: Use styled `<pre>` blocks with proper syntax highlighting
- **Interactive elements**: Leverage Storybook controls and actions

### README Files

- **Structure**: Badges → Description → Installation → Usage → API
- **Languages**: English (README.md) and Chinese (README.zh-CN.md)
- **Consistency**: Follow the same structure across all packages

## Git & Version Control

### Branch Strategy

- **Main branch**: `main` (production-ready code)
- **Feature branches**: `feature/description` or `fix/issue-number`
- **Release branches**: `release/v1.2.3` (when needed)

### Commit Conventions

- **Format**: `type(scope): description`
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Examples**:
  - `feat(fetcher): add timeout configuration`
  - `fix(decorator): handle null parameters correctly`
  - `docs: update API documentation`

### Pull Requests

- **Title**: Clear, descriptive summary
- **Description**: What, why, and how changes
- **Labels**: Appropriate type and impact labels
- **Reviews**: Require at least one approval
- **CI**: All checks must pass before merge

## Release & Deployment

### Version Management

- **Strategy**: Semantic versioning (MAJOR.MINOR.PATCH)
- **Automation**: `pnpm update-version` script
- **Changelog**: Generated from conventional commits

### Publishing Process

```bash
# Update versions across all packages
pnpm update-version

# Build all packages
pnpm build

# Publish to npm (automated via CI/CD)
pnpm publish-npm
```

### CI/CD Pipeline

- **Trigger**: Push to `main` branch
- **Checks**: Lint → Test → Build → Publish
- **Artifacts**: Storybook deployment, coverage reports
- **Environments**: Development → Staging → Production

## Performance Considerations

### Bundle Size

- **Core library**: <5KB min+gzip target
- **Extension packages**: <10KB min+gzip target
- **Tree shaking**: Full support for unused code elimination
- **Monitoring**: Bundle analyzer integration

### Runtime Performance

- **Memory usage**: Minimize object creation in hot paths
- **Network efficiency**: Connection pooling and request deduplication
- **Caching**: Implement appropriate caching strategies
- **Lazy loading**: Support for dynamic imports

### Development Performance

- **Build speed**: Vite for fast development builds
- **Test execution**: Parallel test execution with Vitest
- **Hot reload**: Fast feedback during development

## Troubleshooting

### Common Issues

**Build Failures**

- Check TypeScript errors: `pnpm --filter <package> build`
- Verify dependencies: `pnpm install`
- Clear cache: `pnpm clean && pnpm install`

**Test Failures**

- Run specific test: `pnpm --filter <package> test <file>`
- Debug with Vitest UI: `pnpm --filter <package> test --ui`
- Check coverage: `pnpm --filter <package> test --coverage`

**Storybook Issues**

- MDX parsing errors: Check list item formatting
- Component rendering: Verify Antd imports and usage
- Build issues: `pnpm build-storybook` for detailed errors

### Debug Commands

```bash
# Type check specific package
pnpm --filter <package> exec tsc --noEmit

# Run tests with debug output
pnpm --filter <package> test --reporter=verbose

# Analyze bundle size
pnpm --filter <package> build && npx vite-bundle-analyzer dist/

# Check for circular dependencies
pnpm --filter <package> exec madge --circular src/
```

## Security Guidelines

### Code Security

- **Input validation**: Validate all user inputs
- **XSS prevention**: Sanitize HTML content and user data
- **CSRF protection**: Implement appropriate CSRF tokens
- **Secrets management**: Never commit secrets or keys

### Dependency Security

- **Audit**: Regular `pnpm audit` checks
- **Updates**: Automated dependency updates via Renovate
- **Vulnerabilities**: Immediate patching of critical issues

### Authentication & Authorization

- **Token handling**: Secure storage and transmission
- **Session management**: Proper session lifecycle
- **Permission checks**: Validate user permissions on all endpoints
