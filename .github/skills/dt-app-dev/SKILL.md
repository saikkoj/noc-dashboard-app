---
name: dt-app-dev
description: "Develop and modify the NOC Dashboard Dynatrace App. Use when: adding pages, creating components, writing DQL queries, using Strato design system, following Dynatrace experience standards, wiring live data, building topology views, or any Dynatrace App Platform development."
argument-hint: "Describe the feature, component, or change to implement"
---

# Dynatrace App Developer — NOC Dashboard

## When to Use

- Adding new pages, components, or features to this Dynatrace App
- Creating or modifying DQL queries for live data
- Using Strato design system components
- Following Dynatrace Experience Standards
- Wiring demo mode vs live mode data
- Extending the topology, incidents, devices, or any view
- Looking up SDK methods or Strato component APIs

## Tool Strategy

### Strato Design System — Component Lookup

Always look up components before using them. Two MCP servers provide Strato docs:

**Strato Docs MCP** (primary for component reference):

1. `mcp_strato-docs-m_strato_list_components` — List all available components by category with import paths
2. `mcp_strato-docs-m_strato_list_component_usecases` — List available usage examples for a component
3. `mcp_strato-docs-m_strato_get_usage_examples` — Get code examples for specific use cases
4. `mcp_strato-docs-m_strato_get_component_props` — Get props/API reference for a component

**Dynatrace App MCP** (additional search + experience standards + SDK docs):

5. `mcp_dynatrace-app_strato_search` — Search components by name or keyword
6. `mcp_dynatrace-app_strato_get_component` — Get full component docs with props, types, and examples
7. `mcp_dynatrace-app_strato_get_usecase_details` — Get detailed code for specific component use cases
8. `mcp_dynatrace-app_get_exp_standard` — Get Dynatrace Experience Standards (AppHeader, DataTable, permissions, empty states, etc.)
9. `mcp_dynatrace-app_sdk_search` — Search available Dynatrace SDK packages
10. `mcp_dynatrace-app_sdk_get_doc` — Get full SDK documentation for a specific package
11. `mcp_dynatrace-app_dql_search` — Search DQL syntax, functions, and best practices

### Workflow: Adding a New Strato Component

```
1. mcp_strato-docs-m_strato_list_components → find the component + import path
2. mcp_strato-docs-m_strato_list_component_usecases → discover available examples
3. mcp_strato-docs-m_strato_get_usage_examples → get code for the relevant use case
4. mcp_strato-docs-m_strato_get_component_props → check props API if needed
5. Optionally: mcp_dynatrace-app_get_exp_standard → verify UX compliance
```

### Workflow: Writing DQL Queries

```
1. mcp_dynatrace-app_dql_search → look up syntax/functions/patterns
2. Reference existing queries in ui/app/data/networkQueries.ts for style
3. Follow the join-via-lookup pattern used throughout the app
```

### Workflow: Using Dynatrace SDKs

```
1. mcp_dynatrace-app_sdk_search → discover available SDKs
2. mcp_dynatrace-app_sdk_get_doc → get full API reference for the SDK
```

## App Architecture

### Stack

- **Platform**: Dynatrace App Platform (`dt-app` CLI)
- **UI**: React 18 + TypeScript + Strato Design System
- **Data**: DQL queries via `@dynatrace-sdk/client-query` + `useDql` hook from `@dynatrace-sdk/react-hooks`
- **Navigation**: `react-router-dom` v6 (client-side), `@dynatrace-sdk/navigation` (Dynatrace intents)
- **Build**: `dt-app build --prod` / `dt-app dev`

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `@dynatrace/strato-components` | Stable Strato components (Flex, Button, typography) |
| `@dynatrace/strato-components-preview` | Preview components (Page, AppHeader, DataTable, overlays) |
| `@dynatrace/strato-design-tokens` | Design tokens for spacing, colors, typography |
| `@dynatrace/strato-icons` | Icon set |
| `@dynatrace/strato-geo` | Geographic mapping component |
| `@dynatrace-sdk/client-query` | DQL query execution |
| `@dynatrace-sdk/react-hooks` | `useDql` hook for reactive queries |
| `@dynatrace-sdk/navigation` | `sendIntent`, `getAppLink` for inter-app navigation |
| `@dynatrace-sdk/client-classic-environment-v2` | Classic API access (entities, metrics, problems) |

### File Structure

```
ui/
  main.tsx                    # Entry point
  app/
    App.tsx                   # Root: ErrorBoundary → DemoModeProvider → TimeframeProvider → Page + Routes
    components/               # Reusable UI components
    data/
      demoData.ts             # Static demo data for all pages
      customerData.ts         # Customer/service portal demo data
      networkQueries.ts       # All DQL query strings
    hooks/
      useDemoMode.tsx          # Demo/live mode context toggle
      useTimeframe.tsx         # Timeframe context with DQL timeframe params
      useTopologyData.ts       # Topology graph data (DQL or demo)
      useClusterData.ts        # Geographic cluster data
    pages/                    # Route page components
    types/
      network.ts              # All domain types
    utils/
      index.ts                # Colors, formatting, navigation helpers
      layoutEngine.ts         # Force/hierarchical graph layout
      smartscapeNav.ts         # Smartscape navigation helpers
```

## Conventions to Follow

### 1. Demo Mode Pattern

Every page must support **demo mode** (static data) and **live mode** (DQL queries). The toggle is provided by `useDemoMode()`.

```tsx
const { demoMode } = useDemoMode();

// In hooks: conditionally enable DQL
const result = useDql(
  { query: NETWORK_QUERIES.someQuery, ...dqlTimeframe },
  { enabled: !demoMode, refetchInterval: 60_000 },
);

// In pages: pick data source
const data = demoMode ? DEMO_DATA : liveData;
```

### 2. Page Structure

Every page follows this pattern:
- Import from Strato (`Flex`, `Page`)
- Use `useDemoMode()` for data source selection
- Use `useTimeframe()` for DQL timeframe params
- Return a `<Flex flexDirection="column" gap={16}>` wrapper

### 3. DQL Query Style

Queries are stored as multi-line template strings in `networkQueries.ts`:
- Use `fetch \`dt.entity.*\`` for entity queries
- Use `timeseries` for metric queries
- Use `lookup` for joins (NOT SQL-style joins)
- Use `fieldsAdd` for computed fields
- Sort by relevance (e.g., `sort problems desc`)
- Apply `limit` for bounded results

### 4. Component Patterns

- Strato `Page` layout with `Page.Header` and `Page.Main`
- `AppHeader` with `NavigationItem` using `NavLink` from react-router
- Health colors from `HEALTH_COLORS` and severity from `SEVERITY_COLORS` in utils
- Formatting helpers: `formatPct`, `formatMs`, `formatTraffic`, `toNum`
- Interactive elements use Strato buttons, tooltips, modals

### 5. Type Definitions

All domain types live in `types/network.ts`. Key types:
- `HealthStatus`: `'healthy' | 'degraded' | 'outage' | 'unknown'`
- `Severity`: `'critical' | 'major' | 'minor' | 'info'`
- `DeviceRole`: Network/Smartscape entity roles (cloud-gw → application)
- `TopologyNode` / `TopologyEdge`: Graph types with layout positions
- `NetworkDevice` / `NetworkInterface`: Device/interface table types

### 6. Adding a New Page

1. Create `ui/app/pages/NewPage.tsx` following existing page pattern
2. Add route in `App.tsx` under `<Routes>`
3. Add navigation item in `Header.tsx` under `AppHeader.Navigation`
4. If the page needs DQL data, add query to `networkQueries.ts`
5. If the page needs demo data, add to `demoData.ts`
6. Add any new types to `types/network.ts`

### 7. Adding a New Component

1. Create in `ui/app/components/ComponentName.tsx`
2. Look up Strato components first via MCP tools (see workflow above)
3. Follow existing patterns for props interfaces
4. Use Strato design tokens for spacing/colors, NOT raw CSS values
5. Use `HEALTH_COLORS`, `SEVERITY_COLORS` from utils for status indicators

### 8. Smartscape Topology Queries

The app uses Smartscape traversal for topology edges:
```
smartscapeNodes EXT_NETWORK_DEVICE
| traverse { belongs_to }, { EXT_NETWORK_INTERFACE }, direction:"backward"
| traverse { calls }, { EXT_NETWORK_INTERFACE }, direction:"forward"
| traverse { belongs_to }, { EXT_NETWORK_DEVICE }, direction:"forward"
```

### 9. Scopes

New API access requires adding scopes to `app.config.json` under `app.scopes`. Current scopes include: storage (logs, buckets, events, bizevents, entities, metrics, smartscape, filter-segments), environment-api (problems, entities, metrics), and settings objects.

## Quality Checklist

Before completing any feature:
- [ ] Works in both demo mode and live mode (or demo mode if live not yet wired)
- [ ] Types added to `types/network.ts` if new domain concepts introduced
- [ ] DQL queries follow the lookup-join pattern from existing queries
- [ ] Strato components looked up via MCP before use (correct imports, correct props)
- [ ] Experience Standards checked if touching AppHeader, DataTable, empty states, or permissions
- [ ] No hardcoded colors — use design tokens or existing color maps
- [ ] Formatting uses utility helpers (`formatPct`, `formatMs`, etc.)
