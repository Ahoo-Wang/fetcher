# AGENTS.md — Fetcher Wiki (VitePress Site)

## Build & Run Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Start dev server
pnpm build                # Build static site
pnpm preview              # Preview built site
pnpm fix:mermaid          # Auto-fix Mermaid syntax issues
```

## Wiki Structure

```
wiki/
  index.md                — Homepage (VitePress home layout)
  start/                  — First HTTP / React / Viewer integration
  guides/                 — HTTP, services, streaming, React, Viewer, integrations
  architecture/           — Boundaries, runtime, lifecycle, failures and ownership
  reference/              — Package overview, contract topics, final symbols index
  examples/               — Runnable HTTP source and shared React / Viewer recipes
  skills/                 — Agent workflow entry points
  contributing/           — Development, tests and documentation maintenance
  zh/                     — Chinese translations (mirrors root structure)
  .vitepress/             — VitePress config, theme
  scripts/                — Mermaid fix scripts
  public/                 — Static assets (fetcher-logo.png)
```

## Content Conventions

- **Frontmatter**: Every page needs `title` and `description`
- **Mermaid**: Dark-mode colors only — node fills `#2d333b`, borders `#6d5dfc`, text `#e6edf3`
- **Mermaid**: Use `autonumber` in sequenceDiagram, no `<br/>` (use `<br>`)
- **Citations**: Linked format `[file:line](https://github.com/Ahoo-Wang/fetcher/blob/main/file#Lline)`
- **Tables**: Prefer tables over prose for structured data
- **Cross-references**: Link between wiki pages with relative Markdown links
- **Chinese translations**: Full translations in `zh/` directory, not summaries

## Bilingual Support

- English: root directory (default)
- Chinese: `zh/` directory
- VitePress locales configured in `.vitepress/config/en.ts` and `zh.ts`

## Boundaries

✅ **Always**: Run `pnpm fix:mermaid` after adding/editing Mermaid diagrams
⚠️ **Ask first**: Modifying theme CSS, changing VitePress config, restructuring navigation
🚫 **Never**: Use light-mode colors in Mermaid, use `<br/>` in Mermaid labels, skip Chinese translations

## Current page maintenance

- Keep explicit reading order in `.vitepress/config/pages.mjs` and reference topics in `.vitepress/config/reference.mjs`; every package ends with `symbols`.
- Mirror every page in Chinese before generating. Mark each reading group's first `prev: false` and last `next: false` to stop unrelated pagination.
- Full source snippets use only `<<< @/examples/http/client.ts` or `<<< @/../stories/docs/Filename.tsx`, resolved from the wiki root. Do not use regions, line ranges or custom includes.
- Run `pnpm --dir wiki generate:llms`, `node --test wiki/test/documentation.test.mjs`, and `pnpm --dir wiki build` from the repository root. Never hand-edit `llms.txt`, `llms-full.txt`, or `.vitepress/dist/`.
- Maintain only current pages: remove replaced routes and update links without compatibility pages or redirects.
