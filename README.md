# PRD Clarity Bridge

Create a new application called SpecBridge AI — PRD-to-Engineering Gap Analyzer.

PROJECT PURPOSE

SpecBridge AI helps Product Managers and Product Owners review PRDs before engineering handoff, identify potentially unclear requirements, and reduce unnecessary clarification cycles.

Use the attached SpecBridge AI source archive and product brief as reference if accessible. Do not claim to have inspected files that are unavailable. If the archive cannot be processed, tell me what source files are needed.

FIRST MILESTONE ONLY

Build a responsive React + TypeScript + Tailwind CSS application foundation.

Preserve the existing design direction: a professional SaaS workspace with a deep-green sidebar, warm off-white background, teal accents, cards, clean typography, and optional dark mode.

Create:

1. Sidebar: New Analysis, Analysis History, Admin Dashboard.

2. A structured PRD input form with Feature Title (required), Product Name (optional), Feature Description (required), Target Users (optional), PRD Content (required), Acceptance Criteria (optional).

3. Validate empty required fields and PRD length of 100–20,000 characters, including server-side validation when the backend is implemented.

4. Analyze PRD and Clear Form controls.

5. A separate Results component designed to show categories, severity, exact supporting evidence, clarification suggestions and detection strength.

6. Responsive desktop and mobile layouts.

ARCHITECTURE

Prepare for a deterministic logic engine that runs before AI, followed by an LLM API call, output validation, database persistence, and a protected admin dashboard.

Do not create simulated findings, fake analysis history or fabricated dashboard metrics.

Do not integrate an LLM, database or authentication yet.

Keep history and dashboard marked Coming Soon.

Use synthetic test data only.

Stop after the initial working form and provide a summary of implemented features, validation tests and remaining work.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b03c024d-9c55-4ca6-b878-10862b46e853).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
