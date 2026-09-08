---
title: Contribute a focused change
description: Contribute a focused change — Fetcher
---

# Contribute a focused change

## Start at the affected boundary

Read root AGENTS.md and the rules under the package or wiki directory you will change. Follow the existing implementation and test layout before introducing a different pattern.

1. [Set up the workspace](./development.md).
2. Reproduce or define the behavior at the real public boundary.
3. Implement the scoped change and update its bilingual documentation.
4. [Run the relevant checks](./testing.md), then the required repository gate before committing.

Use conventional commit titles. New work branches from main; pull requests merge with squash. A library API change must include the matching Skill reference and an appropriate version decision. Publishing is separate from local validation.

For documentation-only work, follow [Documentation maintenance](./documentation.md); a successful site build verifies links and rendering, not the truth of every API example.
