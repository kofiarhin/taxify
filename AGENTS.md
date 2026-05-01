# Repository Guidelines

## Project Structure & Module Organization
`taxify` is split into `client/` and `server/`. The frontend lives in `client/` as a Vite + React app; current source files are under `client/src/` with assets in `client/src/assets/` and static files in `client/public/`. The backend is flat under `server/` with entry files `server/app.js` and `server/server.js`. As the app grows, follow the repo target structure from project rules: frontend code in `client/src/components`, `pages`, `services`, `hooks`, and `redux/`; backend code in `server/controllers`, `routes`, `models`, `middleware`, and `tests/`.

## Build, Test, and Development Commands
- `npm install` at the repo root: installs backend dependencies.
- `cd client && npm install`: installs frontend dependencies.
- `cd client && npm run dev`: starts the Vite dev server.
- `cd client && npm run build`: creates the production frontend build.
- `cd client && npm run preview`: serves the built frontend locally.
- `cd client && npm run lint`: runs ESLint on `js` and `jsx` files.

The root `npm test` script is still a placeholder and currently fails by design. Add real test scripts before relying on it in CI.

## Coding Style & Naming Conventions
Use 2-space indentation in JavaScript and JSX. Prefer functional React components, `PascalCase` for components (`TaxSummaryCard.jsx`), and `camelCase` for variables, functions, and hooks. Keep API logic out of components and place shared frontend API access in `client/src/lib/api.js`. Use Tailwind CSS as the default styling system for new UI work; do not mix styling approaches within a feature. Linting is configured in `client/eslint.config.js`.

## Testing Guidelines
Frontend tests should use Vitest + React Testing Library in `client/test/`. Backend tests should use Jest + Supertest in `server/tests/`. Name test files `*.test.js` or `*.spec.js`. This scaffold does not yet include working test scripts, so contributors adding features should add the matching test command in the relevant `package.json`.

## Commit & Pull Request Guidelines
This workspace is missing `.git`, so local commit history could not be inspected. Use short, imperative commit messages such as `Add tax estimate form validation`. Keep commits focused. PRs should include a clear summary, linked issue or task, test notes, and screenshots for UI changes.

## Security & Configuration Tips
Keep backend secrets in the root `.env` and frontend variables in `client/.env` with the `VITE_` prefix. Never hard-code API URLs or secrets. Frontend network calls should read `import.meta.env.VITE_API_URL`, and backend code should fail fast when required environment variables are missing.
