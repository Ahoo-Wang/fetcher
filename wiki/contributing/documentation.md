---
title: Documentation
description: Keep Fetcher Wiki, README, examples, diagrams, and package skills accurate and bilingual.
---

# Documentation

## Source of truth

The Wiki owns learning paths, recipes, and reference. Root and package README
files are short entry points. Before documenting a symbol, signature, default,
or failure, verify the public package entry point and its implementation or
tests.

## Bilingual parity

Every English Wiki page outside generated artifacts has a Chinese counterpart
at the same path under `wiki/zh/`. Keep headings, examples, links, and diagrams
structurally identical; translate the explanation naturally without translating
API identifiers.

Every page starts with a unique title and description:

```yaml
---
title: First Request
description: Install Fetcher and make a typed HTTP request in five minutes.
---
```

## Examples and security

- Make the smallest useful example copyable.
- Use `example.com`, `example.test`, fixed fake IDs, and obvious placeholders.
- Never place credentials, private hosts, personal data, or live service calls
  in documentation or Storybook.
- Explain browser/server trust boundaries where secrets are involved.

## Mermaid

Use the existing dark palette, `autonumber` for sequence diagrams, and `<br>`
inside node labels. Validate diagrams before building:

```bash
pnpm --dir wiki fix:mermaid
pnpm --dir wiki build
```

## Generated artifacts

Do not hand-edit `wiki/llms.txt`, `wiki/llms-full.txt`, or
`wiki/.vitepress/dist/`. Build output and generated client code must be
regenerated from their source.

## Review checklist

- English and Chinese files both changed.
- Names, signatures, defaults, and errors match source.
- Internal links target canonical Start, Learn, Recipes, Reference, or
  Contributing paths.
- Code and diagrams build.
- A package public API change also updates its matching `skills/*/references/api.md`.
