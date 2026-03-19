/**
 * Alerts — real-time Davis problems grouped by severity,
 * plus top interfaces by error rate.
 */
import React, { useMemo, useState } from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Heading, Paragraph } from '@dynatrace/strato-components/typography';
import {
  DataTable,
  type DataTableColumnDef,
} from '@dynatrace/strato-components-preview/tables';
import { Tab, Tabs } from '@dynatrace/strato-components-preview/navigation';
import { FilterBar } from '@dynatrace/strato-components-preview/filters';
import { TextInput } from '@dynatrace/strato-components-preview/forms';
import Colors from '@dynatrace/strato-design-tokens/colors';
import { useDql } from '@dynatrace-sdk/react-hooks';
import { useDemoMode } from '../hooks/useDemoMode';
import { useTimeframe } from '../hooks/useTimeframe';
import { NETWORK_QUERIES } from '../data/networkQueries';
import {
  DEMO_DAVIS_PROBLEMS,
  DEMO_TOP_INTERFACES_BY_ERRORS,
  type DemoInterfaceErrorRow,
} from '../data/demoData';
import type { DavisProblem, DavisProblemSeverity } from '../types/network';
import {
  modeBadgeStyle,
  toNum,
  formatAge,
  entityLinkStyle,
  openProblemDetail,
  SEVERITY_COLORS,
} from '../utils';

/* ── Severity display config ───────────────────── */

const SEV_META: Record<DavisProblemSeverity, { label: string; color: string }> = {
  AVAILABILITY:   { label: 'Availability', color: SEVERITY_COLORS.critical },
  ERROR:          { label: 'Error',        color: SEVERITY_COLORS.major },
  SLOWDOWN:       { label: 'Slowdown',     color: SEVERITY_COLORS.minor },
  RESOURCE:       { label: 'Resource',     color: SEVERITY_COLORS.major },
  CUSTOM_ALERT:   { label: 'Custom',       color: SEVERITY_COLORS.info },
};

const SEVERITY_ORDER: DavisProblemSeverity[] = [
  'AVAILABILITY', 'ERROR', 'RESOURCE', 'SLOWDOWN', 'CUSTOM_ALERT',
];

function SeverityBadge({ severity }: { severity: DavisProblemSeverity }) {
  const meta = SEV_META[severity] ?? SEV_META.CUSTOM_ALERT;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: 10,
      background: `${meta.color}20`, color: meta.color, textTransform: 'uppercase',
    }}>
      {meta.label}
    </span>
  );
}

/* ── Problems DataTable columns ────────────────── */

function useProblemColumns(): DataTableColumnDef<DavisProblem>[] {
  return useMemo(() => [
    {
      id: 'displayId',
      header: 'ID',
      accessor: 'displayId',
      cell: ({ value, rowData }: any) => (
        <span style={entityLinkStyle} onClick={() => openProblemDetail(rowData.problemId)}>
          {value}
        </span>
      ),
    },
    {
      id: 'severity',
      header: 'Severity',
      accessor: 'severity',
      cell: ({ value }: any) => <SeverityBadge severity={value} />,
    },
    {
      id: 'title',
      header: 'Title',
      accessor: 'title',
    },
    {
      id: 'managementZone',
      header: 'Management Zone',
      accessor: 'managementZone',
    },
    {
      id: 'affectedCount',
      header: 'Affected',
      accessor: (row: DavisProblem) => row.affectedEntities.length,
      columnType: 'number',
    },
    {
      id: 'startTime',
      header: 'Started',
      accessor: 'startTime',
      cell: ({ value }: any) => <span>{formatAge(value)}</span>,
    },
  ], []);
}

/* ── Interface errors table columns ────────────── */

function useErrorColumns(): DataTableColumnDef<DemoInterfaceErrorRow>[] {
  return useMemo(() => [
    { id: 'rank', header: '#', accessor: (_: DemoInterfaceErrorRow, i: number) => i + 1, columnType: 'number' },
    { id: 'interfaceName', header: 'Interface', accessor: 'interfaceName' },
    { id: 'deviceName', header: 'Device', accessor: 'deviceName' },
    {
      id: 'totalErrors', header: 'Errors', accessor: 'totalErrors', columnType: 'number',
      thresholds: [
        { rules: [{ accessor: 'totalErrors', value: 5000, comparator: 'greater-than' as const }], color: Colors.Text.Critical.Default },
        { rules: [{ accessor: 'totalErrors', value: 2000, comparator: 'greater-than' as const }], color: Colors.Text.Warning.Default },
      ],
    },
    {
      id: 'errorRate', header: 'Error Rate %', accessor: 'errorRate', columnType: 'number',
      formatter: { maximumFractionDigits: 6 },
    },
  ], []);
}

/* ── Main component ────────────────────────────── */

export function Alerts() {
  const { demoMode } = useDemoMode();
  const { dqlTimeframe } = useTimeframe();
  const [filterText, setFilterText] = useState('');

  /* ── Davis problems DQL ──────────────────────── */
  const problemsResult = useDql(
    {
      query: NETWORK_QUERIES.davisProblems,
      defaultTimeframeStart: dqlTimeframe.defaultTimeframeStart,
      defaultTimeframeEnd: dqlTimeframe.defaultTimeframeEnd,
    },
    { enabled: !demoMode, refetchInterval: 30_000 },
  );

  const liveProblems = useMemo<DavisProblem[]>(() => {
    if (demoMode || !problemsResult.data?.records) return [];
    return (problemsResult.data.records as Record<string, unknown>[]).map(r => ({
      problemId: String(r['problemId'] ?? ''),
      displayId: String(r['displayId'] ?? ''),
      title: String(r['title'] ?? ''),
      severity: String(r['severity'] ?? 'CUSTOM_ALERT') as DavisProblemSeverity,
      status: String(r['status'] ?? 'OPEN') as 'OPEN' | 'CLOSED',
      startTime: String(r['startTime'] ?? new Date().toISOString()),
      endTime: r['endTime'] ? String(r['endTime']) : undefined,
      affectedEntities: Array.isArray(r['affectedEntities']) ? (r['affectedEntities'] as unknown[]).map(String) : [],
      rootCauseEntity: r['rootCauseEntity'] ? String(r['rootCauseEntity']) : undefined,
      managementZone: Array.isArray(r['managementZone'])
        ? (r['managementZone'] as unknown[]).join(', ')
        : r['managementZone'] ? String(r['managementZone']) : undefined,
    }));
  }, [demoMode, problemsResult.data]);

  /* ── Top interfaces by errors DQL ────────────── */
  const errorsResult = useDql(
    {
      query: NETWORK_QUERIES.topInterfacesByErrors,
      defaultTimeframeStart: dqlTimeframe.defaultTimeframeStart,
      defaultTimeframeEnd: dqlTimeframe.defaultTimeframeEnd,
    },
    { enabled: !demoMode, refetchInterval: 60_000 },
  );

  const liveErrors = useMemo<DemoInterfaceErrorRow[]>(() => {
    if (demoMode || !errorsResult.data?.records) return [];
    return (errorsResult.data.records as Record<string, unknown>[]).map(r => ({
      interfaceId: String(r['dt.entity.network:interface'] ?? ''),
      interfaceName: String(r['if.interfaceName'] ?? ''),
      deviceName: String(r['d.deviceName'] ?? ''),
      totalErrors: toNum(r['totalErrors']),
      totalBytes: toNum(r['totalBytes']),
      errorRate: toNum(r['errorRate']),
    }));
  }, [demoMode, errorsResult.data]);

  const problems = demoMode ? DEMO_DAVIS_PROBLEMS : liveProblems;
  const interfaceErrors = demoMode ? DEMO_TOP_INTERFACES_BY_ERRORS : liveErrors;

  /* ── Filter + group ──────────────────────────── */
  const filtered = useMemo(() => {
    if (!filterText.trim()) return problems;
    const lc = filterText.toLowerCase();
    return problems.filter(p =>
      p.title.toLowerCase().includes(lc) ||
      p.displayId.toLowerCase().includes(lc) ||
      (p.managementZone ?? '').toLowerCase().includes(lc),
    );
  }, [problems, filterText]);

  const grouped = useMemo(() => {
    const map = new Map<DavisProblemSeverity, DavisProblem[]>();
    for (const sev of SEVERITY_ORDER) map.set(sev, []);
    for (const p of filtered) {
      const arr = map.get(p.severity);
      if (arr) arr.push(p);
      else map.set(p.severity, [p]);
    }
    return map;
  }, [filtered]);

  const problemColumns = useProblemColumns();
  const errorColumns = useErrorColumns();

  const isLoading = !demoMode && (problemsResult.isLoading || errorsResult.isLoading);

  return (
    <Flex flexDirection="column" gap={16} padding={0}>
      {/* Header */}
      <Flex alignItems="center" justifyContent="space-between">
        <Flex alignItems="center" gap={12}>
          <Heading level={4}>Alerts</Heading>
          <span style={{
            padding: '2px 8px', borderRadius: 10, fontWeight: 700, fontSize: 11,
            background: filtered.length > 0 ? `${SEVERITY_COLORS.critical}20` : 'rgba(42,176,111,0.15)',
            color: filtered.length > 0 ? SEVERITY_COLORS.critical : '#2ab06f',
          }}>
            {filtered.length} open
          </span>
        </Flex>
        <span style={modeBadgeStyle(demoMode)}>{demoMode ? 'DEMO' : 'LIVE'}</span>
      </Flex>

      <Paragraph>Active Davis problems from your environment, grouped by severity. Refreshes every 30 s in live mode.</Paragraph>

      {/* Search filter */}
      <FilterBar onFilterChange={() => {}}>
        <FilterBar.Item name="search" label="Search">
          <TextInput
            placeholder="Search by title, ID, management zone…"
            value={filterText}
            onChange={setFilterText}
          />
        </FilterBar.Item>
      </FilterBar>

      {/* Problems grouped in tabs by severity */}
      <Tabs>
        <Tab title={`All (${filtered.length})`}>
          <DataTable
            data={filtered}
            columns={problemColumns}
            sortable
            resizable
            fullWidth
            loading={isLoading}
          >
            <DataTable.Pagination defaultPageSize={20} />
          </DataTable>
        </Tab>
        {SEVERITY_ORDER.map(sev => {
          const items = grouped.get(sev) ?? [];
          const meta = SEV_META[sev];
          return (
            <Tab key={sev} title={`${meta.label} (${items.length})`}>
              <DataTable
                data={items}
                columns={problemColumns}
                sortable
                resizable
                fullWidth
                loading={isLoading}
              >
                <DataTable.Pagination defaultPageSize={20} />
              </DataTable>
            </Tab>
          );
        })}
      </Tabs>

      {/* Top interfaces by error rate */}
      <Heading level={5}>Top 10 Interfaces by Error Rate</Heading>
      <DataTable
        data={interfaceErrors}
        columns={errorColumns}
        sortable
        fullWidth
        loading={!demoMode && errorsResult.isLoading}
      />
    </Flex>
  );
}

export default Alerts;
