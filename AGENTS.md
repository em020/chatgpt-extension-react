# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds all TypeScript/React code.
- Entry points: `src/main.tsx` (app), `src/popup.tsx` (extension popup UI).
- Extension scripts: `src/background.ts` and `src/content-script.ts`.
- UI components live in `src/components/` (shared UI in `src/components/ui`).
- Utilities and helpers live in `src/lib/`.
- Styles are in `src/styles/` and `src/index.css` / `src/App.css`.
- Static assets are in `src/assets/` and `public/` (extension icons in `public/icons/`).
- Extension manifest is `public/manifest.json`.

## Build, Test, and Development Commands
- `npm run dev` starts Vite in development mode with HMR.
- `npm run build` runs TypeScript build (`tsc -b`) then produces a production bundle.
- `npm run build:extension` is identical to `build` and is used for extension packaging.
- `npm run preview` serves the production bundle locally.
- `npm run lint` runs ESLint over the repository.
- `npm run format` runs Prettier over `src/`.

## Coding Style & Naming Conventions
- Indentation is 2 spaces; semicolons are omitted.
- Use double quotes in TypeScript/TSX to match existing files.
- Component files are PascalCase (e.g., `App.tsx`).
- Hook and utility names use camelCase (e.g., `useX`, `formatY`).
- Linting is configured in `eslint.config.js`; format with Prettier (`npm run format`).

## Testing Guidelines
- No automated test framework is configured yet.
- There is no coverage requirement at this time.
- If you add tests, also add an npm script and document the framework choice.

## Commit & Pull Request Guidelines
- Git history only includes a single `init` commit, so no convention is established.
- Recommended: short, imperative commit messages (e.g., `add popup layout`).
- PRs should include a summary, testing notes (or “not run”), and screenshots for UI changes.

## Extension Notes
- The extension UI is defined in `popup.html` and `src/popup.tsx`.
- Keep `public/manifest.json` in sync with new permissions, scripts, or assets.
