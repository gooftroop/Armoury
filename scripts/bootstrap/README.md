# Bootstrap Scripts

This folder contains standalone Node.js bootstrap utilities for generating and extending monorepos.

## Scripts

- `create-monorepo.js` — scaffolds a new generic TypeScript monorepo skeleton (root configs, tooling packages, CI, docs, and placeholder workspaces).
- `create-workspace.js` — scaffolds a new workspace inside an existing generated monorepo (`library`, `serverless`, `nextjs`, `react-native`, `nestjs-docker`).

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
