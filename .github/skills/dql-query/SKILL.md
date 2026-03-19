---
name: dql-query
description: "Write, debug, or optimize DQL queries for the NOC Dashboard Dynatrace App. Use when: creating new DQL queries, troubleshooting query errors, optimizing performance, adding entity joins, writing timeseries metrics, or using Smartscape traversals."
argument-hint: "Describe what data you need the query to return"
---

# DQL Query Development

## When to Use

- Writing a new DQL query for a page or component
- Debugging a failing or slow DQL query
- Adding metric lookups, entity joins, or Smartscape edges
- Optimizing query performance (reducing scan, adding filters)

## Tool Workflow

```
1. mcp_dynatrace-app_dql_search → look up syntax, functions, entity types
2. Reference existing queries in ui/app/data/networkQueries.ts for style
3. Write the query following the patterns in this skill
4. Add to NETWORK_QUERIES in networkQueries.ts
5. Wire via useDql hook with demo mode guard
```

## Query Patterns (from this app)

### Entity Fetch + Metrics via Lookup

The standard pattern: fetch entities, then enrich with timeseries metrics using `lookup`.

```dql
fetch `dt.entity.network:device`
| fieldsAdd deviceName = entity.name
| lookup [
  timeseries cpuPerc=avg(com.dynatrace.extension.network_device.cpu_usage),
    by:{`dt.entity.network:device`}
  | fieldsAdd cpuMax = arrayMax(cpuPerc)
], sourceField:id, lookupField:`dt.entity.network:device`, prefix:"cpu."
| fieldsAdd cpuPct = cpu.cpuMax
| fields id, deviceName, cpuPct
| sort cpuPct desc
```

Key rules:
- `lookup` performs the join (NOT SQL-style `JOIN`)
- Always use a `prefix:` to namespace lookup columns
- `fieldsAdd` to flatten prefixed results into clean names
- `fields` at the end to select final output columns

### Multiple Metric Lookups

Chain multiple `lookup` blocks — one per metric group:

```dql
fetch `dt.entity.network:device`
| lookup [ ...cpu metrics... ], prefix:"cpu."
| lookup [ ...memory metrics... ], prefix:"mem."
| lookup [ ...problems... ], prefix:"p."
| fieldsAdd cpuPct = cpu.cpuMax, memPct = mem.memMax, problems = coalesce(p.problems, 0)
```

### Problems Lookup

Join Davis problems to any entity:

```dql
| lookup [
  fetch dt.davis.problems
  | expand affected_entity_ids
  | filter startsWith(affected_entity_ids, "CUSTOM_DEVICE")
  | summarize problems=countDistinct(display_id), by:{affected_entity_ids}
], sourceField:id, lookupField:affected_entity_ids, prefix:"p."
| fieldsAdd problems = coalesce(p.problems, 0)
```

Change the `startsWith` filter for different entity types: `"HOST"`, `"SERVICE"`, `"APPLICATION"`.

### Timeseries Metrics

For time-bucketed data (charts, sparklines):

```dql
timeseries {
  ifInBytes = sum(com.dynatrace.extension.network_device.if.bytes_in.count),
  ifOutBytes = sum(com.dynatrace.extension.network_device.if.bytes_out.count)
}, by:{`dt.entity.network:device`, `dt.entity.network:interface`}
| fieldsAdd inTrafficBps = coalesce(arrayMax(ifInBytes), 0) * 8 / 300
```

### Smartscape Traversal (Topology Edges)

For discovering neighbor relationships:

```dql
smartscapeNodes EXT_NETWORK_DEVICE
| traverse { belongs_to }, { EXT_NETWORK_INTERFACE }, direction:"backward", fieldsKeep: { id, name }
| traverse { calls }, { EXT_NETWORK_INTERFACE }, direction:"forward", fieldsKeep: { id, name }
| traverse { belongs_to }, { EXT_NETWORK_DEVICE }, direction:"forward", fieldsKeep: { id, name }
| fields sourceDevice = id, targetDevice = dt.traverse.history[0][id]
| dedup sourceDevice, targetDevice
```

### Smartscape Relationship Expansion

For entity-to-entity edges without traversal:

```dql
fetch `dt.entity.service`
| expand calledService = entity.detectedRelationships[`calls`]
| filter isNotNull(calledService) and startsWith(toString(calledService), "SERVICE")
| fieldsAdd source = id, target = calledService
| fields source, target
```

### BGP Peer Resolution

Match metric-level peer addresses back to device entities:

```dql
timeseries bgpState = avg(com.dynatrace.extension.network_device.bgp.peer.state),
  by:{`dt.entity.network:device`, bgp.peer.remote_addr}
| lookup [
  fetch `dt.entity.network:device`
  | fieldsAdd mgmtIp = entity.name
  | fields id, mgmtIp
], sourceField:bgp.peer.remote_addr, lookupField:mgmtIp, prefix:"peer."
| filter isNotNull(peer.id)
```

## Wiring Queries in Code

### 1. Add query string to `networkQueries.ts`

```typescript
export const NETWORK_QUERIES = {
  // ... existing queries ...

  /** New query description */
  myNewQuery: [
    `fetch \`dt.entity.network:device\``,
    `| fieldsAdd deviceName = entity.name`,
    `| fields id, deviceName`,
  ].join('\n'),
};
```

### 2. Use in a hook or page

```typescript
import { useDql } from '@dynatrace-sdk/react-hooks';
import { useDemoMode } from '../hooks/useDemoMode';
import { useTimeframe } from '../hooks/useTimeframe';
import { NETWORK_QUERIES } from '../data/networkQueries';

const { demoMode } = useDemoMode();
const { dqlTimeframe } = useTimeframe();

const result = useDql(
  { query: NETWORK_QUERIES.myNewQuery, ...dqlTimeframe },
  { enabled: !demoMode, refetchInterval: 60_000 },
);
```

### 3. Map result records

```typescript
const rows = (result.data?.records ?? []).map((r: any) => ({
  id: String(r.id ?? ''),
  name: String(r.deviceName ?? ''),
}));
```

## Common DQL Functions

| Function | Purpose |
|----------|---------|
| `coalesce(a, b)` | First non-null value |
| `arrayMax(arr)` / `arrayAvg(arr)` / `arraySum(arr)` | Aggregate timeseries arrays |
| `startsWith(str, prefix)` | Entity type filtering |
| `countDistinct(field)` | Unique counts |
| `expand field` | Flatten arrays to rows |
| `dedup field1, field2` | Remove duplicate rows |
| `fieldsAdd` | Add computed columns |
| `fields` | Select final output columns |
| `summarize` | Group-by aggregations |

## Debugging Tips

- Query returns empty? Check timeframe — `useDql` needs `defaultTimeframeStart`/`defaultTimeframeEnd`
- Lookup returns nulls? Check that `sourceField` and `lookupField` match the same entity ID format
- Use `| limit 5` during development to speed up iteration
- Check `result.error` from `useDql` for query syntax errors
