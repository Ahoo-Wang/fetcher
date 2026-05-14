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
  guide/                  — Getting Started (intro, quick-start, config)
  architecture/           — Architecture deep dives
  packages/               — Per-package documentation (12 packages)
  api/                    — API reference
  testing/                — Testing guides
  onboarding/             — Audience-tailored onboarding guides
  zh/                     — Chinese translations (mirrors root structure)
  .vitepress/             — VitePress config, theme
  scripts/                — Mermaid fix scripts
  public/                 — Static assets (logo.svg)
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
