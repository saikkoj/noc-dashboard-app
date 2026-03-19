# NOC Dashboard — Project Guidelines

## Stack

- Dynatrace App Platform (`dt-app` CLI), React 18, TypeScript 5.6, Strato Design System
- Data: DQL via `@dynatrace-sdk/client-query` + `useDql` from `@dynatrace-sdk/react-hooks`
- Navigation: `react-router-dom` v6 (client-side), `@dynatrace-sdk/navigation` (intents)

## Code Style

- Functional React components only — no class components
- All domain types in `ui/app/types/network.ts`
- All DQL queries in `ui/app/data/networkQueries.ts` using multi-line template strings
- Formatting helpers in `ui/app/utils/index.ts` — use `formatPct`, `formatMs`, `formatTraffic`, `toNum` etc.
- Colors from `HEALTH_COLORS`, `SEVERITY_COLORS`, `SEVERITY_META` — never hardcode hex values for status indicators
- Use Strato design tokens for spacing and typography, not raw CSS values

## Architecture

- Every page supports **demo mode** (static data from `demoData.ts`) and **live mode** (DQL queries)
- Use `useDemoMode()` hook to check mode; pass `{ enabled: !demoMode }` to `useDql`
- Use `useTimeframe()` for DQL timeframe parameters (`dqlTimeframe`)
- DQL queries use `lookup` for joins, `fieldsAdd` for computed columns, `timeseries` for metrics
- Root layout: `ErrorBoundary → DemoModeProvider → TimeframeProvider → Page`

## Strato Components

- **Always look up Strato components via MCP before using** — APIs change between versions
- Stable imports: `@dynatrace/strato-components/{category}`
- Preview imports: `@dynatrace/strato-components-preview/{category}`
- Icons: `@dynatrace/strato-icons`
- Geographic: `@dynatrace/strato-geo`

## Build & Test

- `npm run start` — local dev server (`dt-app dev`)
- `npm run build` — production build (`dt-app build --prod`)
- `npm run deploy` — deploy to environment
- `npm run lint` — ESLint

## Conventions

- New pages: add component in `pages/`, route in `App.tsx`, nav item in `Header.tsx`
- New scopes: add to `app.config.json` under `app.scopes` with a `comment` field
- Topology edges use Smartscape traversal queries — see `networkQueries.ts` for patterns
