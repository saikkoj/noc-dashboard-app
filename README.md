# NOC Dashboard

A network operations center dashboard built on the **Dynatrace App Platform**, providing real-time visibility into network infrastructure, services, and applications.

## Features

- **Topology Map** — Interactive 2D and 3D visualization of your full network topology across OSI-inspired layers (Cloud/WAN → Routers → Security → Distribution → Hosts → Process Groups → Services → Applications). Clickable nodes and edges with detail panels.
- **Health-Based Edge Coloring** — Connections are color-coded by health status (green/orange/red) with explanations derived from real metrics (CPU, memory, error rate, response time, Apdex, BGP state).
- **Overview Dashboard** — KPI strip with availability, latency, packet loss, jitter, SLA compliance, and incident counts.
- **Incidents** — Active incident list with severity indicators and impact summaries.
- **Alerts** — Davis problem feed from Dynatrace.
- **Devices** — Network device inventory with health, CPU, memory, and reachability metrics.
- **Interfaces** — Interface-level monitoring with utilization, errors, and operational status.
- **Services** — Service health overview with request rate, response time, and error rate.
- **SLA** — SLA compliance reports with downtime tracking.
- **Forecasts** — Capacity and utilization trend forecasting.
- **Tickets** — Ticket management integration.
- **Notifications** — Notification configuration.
- **Self-Service** — Bandwidth upgrade requests and self-service operations.
- **Demo Mode** — Toggle between live DQL data and built-in static demo data for testing or demonstrations.

## Tech Stack

| Layer | Technology |
|---|---|
| Platform | [Dynatrace App Platform](https://developer.dynatrace.com/develop/app-platform/) (`dt-app` CLI) |
| UI | React 18, TypeScript 5.6 |
| Design System | [Strato Design System](https://developer.dynatrace.com/develop/ui/) |
| Data | DQL via `@dynatrace-sdk/client-query` + `useDql` from `@dynatrace-sdk/react-hooks` |
| Routing | `react-router-dom` v6 |
| Navigation | `@dynatrace-sdk/navigation` (intents) |

## Project Structure

```
ui/
  main.tsx                  # App entry point
  app/
    App.tsx                 # Root component with routing
    types/network.ts        # All domain types
    data/
      networkQueries.ts     # DQL query definitions
      demoData.ts           # Static demo data
      customerData.ts       # Customer-specific data
    hooks/
      useDemoMode.tsx       # Demo mode context
      useTimeframe.tsx      # Timeframe context for DQL queries
      useTopologyData.ts    # Topology data fetching & health computation
      useClusterData.ts     # Cluster data hook
    components/
      Header.tsx            # App header with nav, timeframe, demo toggle
      TopologyMap.tsx        # 2D SVG topology renderer
      GraphScene3D.tsx       # 3D Canvas topology renderer
      EdgeDetailPanel.tsx    # Edge detail slide-out panel
      NodeDetailPanel.tsx    # Node detail slide-out panel
      ...                   # KpiStrip, IncidentList, DeviceTable, etc.
    pages/                  # One component per route
    utils/
      index.ts              # Formatting helpers, color maps
      layoutEngine.ts       # Topology layout algorithms
      smartscapeNav.ts      # Smartscape navigation utilities
```

## Getting Started

### Prerequisites

- Node.js ≥ 16.13.0
- [Dynatrace App Toolkit](https://developer.dynatrace.com/develop/troubleshooting/dt-app/) (`dt-app` CLI)
- A Dynatrace environment with network monitoring enabled

### Install

```bash
npm install
```

### Development

```bash
npm run start
```

Starts a local dev server via `dt-app dev`.

### Build

```bash
npm run build
```

### Deploy

```bash
npm run deploy
```

Deploys to the configured Dynatrace environment.

### Lint

```bash
npm run lint
```

## Required Scopes

The app requires the following Dynatrace API scopes (configured in `app.config.json`):

- `storage:entities:read` — Entity queries (topology)
- `storage:metrics:read` — Timeseries metric queries (CPU, BGP, traffic)
- `storage:events:read` — Davis problems
- `storage:logs:read` — Log queries
- `storage:smartscape:read` — Smartscape neighbor traversal
- `environment-api:entities:read` — Network device entities
- `environment-api:metrics:read` — Network device metrics
- `environment-api:problems:read` — Problems API

## Architecture

Every page supports **demo mode** (static data) and **live mode** (DQL queries). The `useDemoMode()` hook controls the toggle. DQL queries receive timeframe parameters from the global `useTimeframe()` context.

The topology view queries Dynatrace Smartscape to discover all entity relationships and renders them across 8 layers. Edge health is computed from:
- **BGP edges**: Actual BGP peer session state metric (1=Idle → 6=Established)
- **All other edges**: Worst health of connected endpoint nodes, with explanations based on real metrics (CPU %, memory %, error rate, response time, Apdex)
