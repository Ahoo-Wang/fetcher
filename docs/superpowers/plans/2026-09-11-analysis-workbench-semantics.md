# Result-first analysis workbench: implementation requirements

User-approved adjustment, on the existing branch and four-region implementation. No alternative architecture or automatic PR monitoring.

1. Preserve instance-local UI/editor lifetime, with data mode hiding (not resetting) the visualization preference. Keep modal focus/scroll behavior.
2. Expose synchronous query admission plus the existing completion promise. The Sheet closes only on admission; failures focus validation and do not close it. Completion never changes Sheet state.
3. Bind result explanations and schema to the last successful snapshot; preserve failure feedback and distinguish retry of matching query semantics from running the current draft. Guard result sorting in the shared command against unrun drafts.
4. Preserve presentation during query edits. Use current display draft over executed schema, explicit mapping for ambiguous choices, and progressive style settings. Reuse projection compatibility, preserving grouped identity and aggregation semantics.
5. Tests: accepted B/editor C isolation, invalid admission, snapshot captions/schema, retained raw input/UI across instances, failure revisit, save/run separation, no-query display operations, ambiguous mappings and sort refusal. Full unit/build/type/lint/docs and browser checks run independently; monitor remains paused.
