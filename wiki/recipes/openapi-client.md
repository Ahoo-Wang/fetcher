---
title: Generate an OpenAPI Client
description: Generate Fetcher TypeScript models and clients from a local or remote OpenAPI document.
---

# Generate an OpenAPI Client

Use the generator when OpenAPI is already the source contract. Generated code should be reproducible, not hand-edited.

## Install

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator
pnpm add -D @ahoo-wang/fetcher-generator
```

## Generate

```bash
pnpm exec fetcher-generator generate \
  -i ./openapi.yaml \
  -o ./src/generated \
  -t ./tsconfig.json
```

The input may be a local JSON/YAML file or an HTTP/HTTPS URL. The default output is `src/generated`; providing the paths explicitly makes CI and local runs identical.

## Configuration

The optional configuration flag is:

```bash
-c ./fetcher-generator.config.json
```

Without `-c`, the generator looks for `./fetcher-generator.config.json`. A log such as `Configuration file parsing failed: ENOENT` means optional configuration was absent; generation continues with an empty configuration.

## Use generated code

Generated directories contain model, client, and index files derived from the document. Import through the generated index rather than a generator-internal path:

```ts
import { UserApiClient, type User } from './generated';

const client = new UserApiClient();
const user: User = await client.getUser('42');
```

Exact names follow OpenAPI operation IDs and schemas. Inspect the generated index after the first run before writing application imports.

## Regenerate safely

1. Keep the OpenAPI document or stable source URL in version control/configuration.
2. Run generation into the same directory.
3. Format and type-check the result.
4. Review the generated diff for operation/schema renames.
5. Never place custom application code inside the generated directory.

## Diagnose failures

- `Input OpenAPI specification file path or URL` errors: verify `-i` and network access for remote input.
- TypeScript project initialization errors: verify `-t` points to an existing tsconfig.
- Missing expected clients: check operation IDs, tags, response schemas, and generator-specific discovery rules.
- A successful generator run does not prove the remote server implements the document; integration-test generated calls separately.

Run `pnpm exec fetcher-generator generate --help` to see the current CLI contract.
