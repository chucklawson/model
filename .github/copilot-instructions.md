## Quick orientation for AI coding agents

This repository is a React + TypeScript app built with Vite and integrated with AWS Amplify. The goal of these notes is to make an AI coding agent immediately productive by calling out the project's structure, conventions, and important edit/run checks.

Key facts
- Entry point: `src/main.tsx` (calls `Amplify.configure(outputs)` using `amplify_outputs.json`).
- App wiring & routes: `src/App.tsx` — uses `react-router` with a `RootLayout` under `src/Pages/RootLayout/RootLayout.tsx` and pages under `src/Pages/*`.
- UI: Tailwind CSS classes are used extensively; components live in `src/Components/*` and images in `src/Images`.
- Domain libs: `src/Lib/*` contains finance-related types and helpers (e.g. `Quote_V3.ts`, `HistoricalPriceFull_V3.ts`, `TickersToEvaluate/*`).
- AWS backend: `amplify/backend.ts` and `amplify/` package.json show Amplify backend definitions — frontend expects `amplify_outputs.json` present at repo root.

How to run & build (exact)
- Install: `npm install` (repo uses standard npm). Observe `package.json` scripts.
- Dev: `npm run dev` (starts Vite HMR).
- Build: `npm run build` which runs `tsc -b && vite build` — note: TypeScript project references are built first.
- Preview production build: `npm run preview`.
- Lint: `npm run lint` (ESLint config present). Run this before refactors.

Project-specific conventions & patterns
- Component/Pages split: put route-level UI into `src/Pages/*`, reused widgets into `src/Components/*`.
- Prop typing: components use explicit TypeScript prop interfaces (example: `BasicTickerEvaluation` in `src/Components/BasicTickerEvaluation/BasicTickerEvaluation.tsx`). Follow that pattern when adding components.
- Many components map arrays to small presentational children (e.g. `props.tickerEntries.map(...)` → `TickerButton`). Keep `key` stable (ticker symbol).
- Legacy/experimental code: several files contain commented-out imports and logic. Prefer minimal, well-typed changes; remove dead code only when tests/preview confirm behavior.
- Styles: Tailwind utility classes are used inline. Avoid introducing new global CSS unless necessary.

Integration points & data flow
- Authentication/UI: `App.tsx` wraps the app with `Authenticator` from `@aws-amplify/ui-react`. Edits that affect route access must respect that wrapper.
- Amplify config: `src/main.tsx` imports `amplify_outputs.json` and calls `Amplify.configure(outputs)`. Any backend changes may require regenerating that file or running Amplify CLI commands.
- Ticker flow: user clicks a `TickerButton` (seen in `BasicTickerEvaluation`) → parent handlers set state → `StockQuote` (in `src/Components/StockQuote/StockQuote.tsx`) fetches and provides quote/time-series data. Search for `onSetCurrentQuote`/`selectTickerButtonHandler` to trace handlers.

Editing & safety checks for PRs
- Always run `npm run lint` and `npm run build` locally after non-trivial edits to catch TypeScript and bundling issues (build runs `tsc -b`).
- Because Amplify is integrated, changes to API/auth/backends may require `amplify` CLI actions — but the frontend can be iterated without pushing backend changes.
- Prefer small commits touching one area: UI, lib types, or backend wiring.

Files to inspect when changing behavior
- `src/main.tsx` — amplify init/config wiring.
- `src/App.tsx` — routes and global wrappers (Authenticator).
- `src/Pages/RootLayout/RootLayout.tsx` — page shell and where navigation is added.
- `src/Components/BasicTickerEvaluation/BasicTickerEvaluation.tsx` and `src/Components/TickerButton/TickerButton.tsx` — example of domain UI and handlers.
- `src/Lib/*` — domain types and helpers for quotes and historical time series.

If you update or create this file
- If `.github/copilot-instructions.md` already exists, merge by keeping these specific project facts and adding any new, verifiable rules — do not replace unrelated custom guidance.

Questions for the maintainer
- Do you expect the agent to run Amplify CLI commands (e.g., provisioning) or only work on the frontend code and test against `amplify_outputs.json`? Mention which is allowed.

If anything above is unclear or you want extra sections (PR checklist, commit message templates, testing examples), tell me which area to expand.
