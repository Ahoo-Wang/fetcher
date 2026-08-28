# Fetcher Storybook Scenario Lab Design

## Goal

Turn Storybook from a package demo list into a developer-facing scenario lab.
Each HTTP and React story must explain the setup, the action, and the contract
to observe before showing the interactive implementation.

## Evidence

The current Storybook has three structural problems:

- Overview lists package groups but does not provide task-oriented entry points.
- HTTP and React canvases are mostly an action button followed by raw output;
  the story name is the only scenario context.
- The internal `scenario` arg is visible as a Control even though exported
  stories already select the scenario and the Control has no usable options.

Viewer stories already demonstrate complete UI components and are explicitly
out of scope for visual or scenario framing changes.

## Scope

### In scope

- Brand the Storybook manager as **Fetcher Scenario Lab** using the current
  blue/violet palette.
- Replace Overview with a task-oriented catalog for request, streaming,
  eventing, React async state, Fetcher hooks, and Wow query scenarios.
- Add a shared scenario frame to all `HTTP & Streaming/*` and `React Hooks/*`
  stories.
- Show the selected story name, domain summary, deterministic fixture, and a
  three-step `Setup → Action → Observe` contract.
- Hide the internal `scenario` arg from Controls.
- Preserve the improved native interaction button states.

### Out of scope

- Any `Viewer/*` story content, component styling, scenario frame, or behavior.
- Package runtime code or public APIs.
- Existing story routes and sidebar hierarchy.
- External services, credentials, nondeterministic data, or new dependencies.

## Experience

### Storybook manager

Use the title `Fetcher Scenario Lab` and the repository brand colors. Do not
restructure story IDs or routes. Keep the text lockup because the square logo
does not fit Storybook's narrow brand slot without losing the product name.

### Overview

Overview becomes the entry point for developer tasks rather than a package
inventory. It contains:

1. A short promise: deterministic, local, credential-free scenario testing.
2. Six linked scenario cards covering the HTTP and React groups.
3. A concise explanation of how to read every scenario: Setup, Action,
   Observe.
4. The existing fixture provenance and documentation link.

### Scenario frame

The global preview decorator wraps only HTTP and React stories. The frame has:

- domain label and current story name;
- one-sentence purpose for the package family;
- deterministic fixture label;
- Setup, Action, and Observe cells;
- the actual story in a separate white stage.

Metadata is keyed by the existing Storybook component title. The current
story name supplies the concrete Action variant, so individual story exports
do not duplicate explanatory markup.

### Visual language

- Use the existing primary `#0958d9` and violet accent.
- Use a light blue neutral lab surface, white stage, 12–16px radii, and compact
  borders instead of decorative imagery.
- Preserve content-width native buttons and accessible focus treatment.
- Reflow the three-step contract to one column on narrow canvases.

## Accessibility

- Keep semantic headings and ordered scene steps.
- Maintain visible keyboard focus at or above 3:1 contrast.
- Do not encode scenario meaning by color alone.
- Keep links and controls at least 36px high where the story owns them.
- Preserve reduced-motion behavior.

## Verification

- Start with failing Storybook assertions for Overview scene links and the
  HTTP/React frame while confirming Viewer has no frame.
- Run all Storybook interaction/a11y tests.
- Build static Storybook.
- Run repository lint and unit tests.
- Capture Overview, Event Bus, Async State, and FetcherViewer at the same
  viewport; compare before/after and confirm Viewer remains unchanged.
