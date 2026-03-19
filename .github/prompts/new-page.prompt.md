---
description: "Scaffold a new page for the NOC Dashboard Dynatrace App with route, navigation, demo data, and optional DQL query."
agent: "agent"
argument-hint: "Page name and what data it shows"
---

Create a new page for the NOC Dashboard app.

## Requirements

- **Page name**: ${input:pageName:Page name (e.g. Alerts)}
- **Description**: ${input:description:What data does this page show?}

## Steps

1. Create `ui/app/pages/${input:pageName}.tsx` following the existing page pattern:
   - Import `Flex` from `@dynatrace/strato-components/layouts`
   - Use `useDemoMode()` to toggle data sources
   - Use `useTimeframe()` for DQL timeframe params
   - Wrap content in `<Flex flexDirection="column" gap={16}>`

2. Add a route in `ui/app/App.tsx`:
   ```tsx
   <Route path="/${input:pageName:lowercase}" element={<${input:pageName} />} />
   ```

3. Add a navigation item in `ui/app/components/Header.tsx` inside `<AppHeader.Navigation>`:
   ```tsx
   <AppHeader.NavigationItem as={NavLink} to="/${input:pageName:lowercase}">
     ${input:pageName}
   </AppHeader.NavigationItem>
   ```

4. Add demo data in `ui/app/data/demoData.ts` for the page.

5. If needed, add a DQL query to `ui/app/data/networkQueries.ts`.

6. Add any new types to `ui/app/types/network.ts`.

7. Use Strato components — look them up via MCP before using (`mcp_strato-docs-m_strato_list_components`).
