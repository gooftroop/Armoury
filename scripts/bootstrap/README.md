# Bootstrap Scripts

This folder contains standalone Node.js bootstrap utilities for generating and extending monorepos.

## Scripts

- `create-monorepo.js` — scaffolds a new generic TypeScript monorepo skeleton (root configs, tooling packages, CI, docs, and placeholder workspaces).
- `create-workspace.js` — scaffolds a new workspace inside an existing generated monorepo (`library`, `serverless`, `nextjs`, `react-native`, `nestjs`; `nestjs-docker` remains a compatibility alias).

## Usage

From the repository root:

```bash
node scripts/bootstrap/create-monorepo.js --name myapp --dir /tmp/myapp --node 24
```

```bash
node scripts/bootstrap/create-workspace.js --name models --location src/shared/models --type library --scope myapp
```

```bash
node scripts/bootstrap/create-workspace.js --name campaigns --location src/services/campaigns --type serverless --scope myapp
```

## Notes on documentation copying

`create-monorepo.js` copies selected documentation files from this repository as parameterized templates. Package/org naming and repository references are rewritten so generated output is generic to the target scope.

## Smoke tests

The bootstrap utilities have a standalone smoke test using Node's built-in test runner (no project dependencies required):

```bash
node --test scripts/bootstrap/create-workspace.smoke.test.js
```

The smoke test scaffolds workspaces into a temporary directory and asserts the generated output is generic (no scope-specific identifiers leaked into templates).
