# SpecBridge AI — first milestone

## Build
- Replace the placeholder home screen with a responsive SpecBridge AI workspace, following the source archive's deep-green sidebar, warm off-white background, teal accents, clean typography, cards, and optional dark mode.
- Include New Analysis as the active view; show Analysis History and Admin Dashboard as Coming Soon, without fabricated entries or metrics.
- Add the six-field PRD form: Feature Title, Product Name, Feature Description, Target Users, PRD Content, and Acceptance Criteria. Require title, description, and PRD content; enforce the inclusive 100–20,000 character PRD limit; show field-specific validation and provide Clear Form.
- Make Analyze PRD validate the form only and clearly state that analysis is not connected yet. Keep a separate Results area ready for categories, severity, exact evidence, clarification suggestions, and detection strength; show no invented findings.
- Add focused tests for blank required values, optional fields, invalid lengths, and both accepted PRD length boundaries. Add unique home-page metadata.

## Technical approach
- Adapt the archive's form and Results design to the existing React, TypeScript, Tailwind, and TanStack project; keep results presentation separate from form state.
- Use client-side validation in this UI milestone. Add matching server-side validation when backend submission is introduced, as requested.
- Do not add an LLM, database, authentication, saved history, dashboard metrics, or analysis engine in this milestone.

## Reference material
- Inspected `docs/SpecBridge_AI_Product_Brief.md`, the archived application form and Results component, the archived validation implementation and tests, and the archived style sheet. The brief recommends evidence-backed findings, rule-first analysis, and no claims that unvalidated hypotheses are proven outcomes.

## Remaining after this milestone
- Add server-side validation with the future backend, then the deterministic engine, LLM call and output checks, persistence, and protected admin dashboard in later phases.
