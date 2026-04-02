# Contributing to {{SCOPE}}

## Getting Started

1. Clone the repository
2. Run `npm install` to install all dependencies
3. Run `npm run build` to build all packages

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run tests: `npm run test`
4. Run linting: `npm run lint`
5. Run type checking: `npm run typecheck`
6. Commit your changes (see commit message format below)
7. Open a pull request

## Code Style

Please follow the coding standards in [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md).

Key points:

- Always use braces for control structures
- Use enums and constants instead of hardcoded values
- Document all functions with comments
- Write pure functions when possible

## Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Your commit messages will be validated by commitlint.

Format: `<type>(<scope>): <description>`

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code change without feature/fix
- `test`: Adding tests
- `chore`: Maintenance tasks
- `build`: Build system changes

Examples:

```
feat(shared): add adapter factory
fix(shared): handle null response from GitHub API
docs: update README with setup instructions
```

## Testing

- Unit tests go in `__tests__/` folders next to the source files
- Mock data goes in `__mocks__/` folders
- Test fixtures go in `__fixtures__/` folders

Run tests:

```bash
npm run test           # Run all tests
npm run test -- --watch  # Watch mode
```

## Pull Request Process

1. Ensure all tests pass
2. Ensure linting passes
3. Update documentation if needed
4. Request review from maintainers
