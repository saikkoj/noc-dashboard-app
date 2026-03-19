/**
 * InterfaceTable — network interface health table with load bars.
 */
import React, { useMemo, useState } from 'react';
import { DataTable, type DataTableColumnDef } from '@dynatrace/strato-components-preview/tables';
import { FilterBar } from '@dynatrace/strato-components-preview/filters';
import { TextInput } from '@dynatrace/strato-components-preview/forms';
import { useDql } from '@dynatrace-sdk/react-hooks';
import { useDemoMode } from '../hooks/useDemoMode';
import { useTimeframe } from '../hooks/useTimeframe';
import { NETWORK_QUERIES } from '../data/networkQueries';
import { DEMO_INTERFACES } from '../data/demoData';
import type { NetworkInterface } from '../types/network';
import { toNum, percentBarColor, formatTraffic, HEALTH_COLORS } from '../utils';

function LoadBar({ value }: { value: number }) {
  const color = percentBarColor(value, 60, 80);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 80 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', borderRadius: 3, background: color }} />
      </div>
      <span style={{ fontSize: 11, color, minWidth: 32, textAlign: 'right' }}>{value.toFixed(0)}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: NetworkInterface['status'] }) {
  const color = status === 'UP' ? HEALTH_COLORS.healthy : status === 'ADMIN_DOWN' ? '#6b7280' : HEALTH_COLORS.critical;
  const label = status === 'ADMIN_DOWN' ? 'ADMIN ↓' : status;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: 10,
      background: `${color}20`, color, textTransform: 'uppercase',
    }}>
      {label}
    </span>
  );
}

export function InterfaceTable() {
  const { demoMode } = useDemoMode();
  const { dqlTimeframe } = useTimeframe();
  const [filterText, setFilterText] = useState('');

  const result = useDql(
    {
      query: NETWORK_QUERIES.interfaceHealth,
      defaultTimeframeStart: dqlTimeframe.defaultTimeframeStart,
      defaultTimeframeEnd: dqlTimeframe.defaultTimeframeEnd,
    },
    { enabled: !demoMode, refetchInterval: 60_000 },
  );

  const liveInterfaces = useMemo<NetworkInterface[]>(() => {
    if (demoMode || !result.data?.records) return [];
    return (result.data.records as Record<string, unknown>[]).map(r => ({
      entityId: String(r['entity.id'] ?? r['id'] ?? ''),
      deviceName: String(r['deviceName'] ?? ''),
      name: String(r['entity.name'] ?? r['name'] ?? ''),
      status: toNum(r['inLoad']) + toNum(r['outLoad']) > 0 ? 'UP' as const : 'DOWN' as const,
      inLoad: toNum(r['inLoad']),
      outLoad: toNum(r['outLoad']),
      inErrors: toNum(r['inErrors']),
      outErrors: toNum(r['outErrors']),
      inDiscards: toNum(r['inDiscards']),
      outDiscards: toNum(r['outDiscards']),
      trafficIn: toNum(r['trafficIn']),
      trafficOut: toNum(r['trafficOut']),
    }));
  }, [demoMode, result.data]);

  const interfaces = demoMode ? DEMO_INTERFACES : liveInterfaces;

  const filtered = useMemo(() => {
    if (!filterText.trim()) return interfaces;
    const lc = filterText.toLowerCase();
    return interfaces.filter(i =>
      i.name.toLowerCase().includes(lc) ||
      i.deviceName.toLowerCase().includes(lc),
    );
  }, [interfaces, filterText]);

  const columns: DataTableColumnDef<NetworkInterface>[] = [
    { id: 'deviceName', header: 'Device', accessor: 'deviceName' },
    { id: 'name', header: 'Rajapinta', accessor: 'name' },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      cell: ({ value }: any) => <StatusBadge status={value} />,
    },
    {
      id: 'inLoad',
      header: 'Kuormitus (IN)',
      accessor: 'inLoad',
      cell: ({ value }: any) => <LoadBar value={value} />,
    },
    {
      id: 'outLoad',
      header: 'Kuormitus (OUT)',
      accessor: 'outLoad',
      cell: ({ value }: any) => <LoadBar value={value} />,
    },
    {
      id: 'inErrors',
      header: 'Virheet (IN/OUT)',
      accessor: 'inErrors',
      cell: ({ rowData }: any) => {
        const inE = rowData.inErrors;
        const outE = rowData.outErrors;
        const total = inE + outE;
        return (
          <span style={{ color: total > 0 ? HEALTH_COLORS.critical : '#888' }}>
            {inE} / {outE}
          </span>
        );
      },
    },
    {
      id: 'inDiscards',
      header: 'Discards (IN/OUT)',
      accessor: 'inDiscards',
      cell: ({ rowData }: any) => {
        const inD = rowData.inDiscards;
        const outD = rowData.outDiscards;
        const total = inD + outD;
        return (
          <span style={{ color: total > 10 ? '#fd8232' : '#888' }}>
            {inD} / {outD}
          </span>
        );
      },
    },
    {
      id: 'trafficIn',
      header: 'Traffic IN',
      accessor: 'trafficIn',
      cell: ({ value }: any) => <span>{formatTraffic(value)}</span>,
    },
    {
      id: 'trafficOut',
      header: 'Traffic OUT',
      accessor: 'trafficOut',
      cell: ({ value }: any) => <span>{formatTraffic(value)}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FilterBar onFilterChange={() => {}}>
        <FilterBar.Item name="search" label="Search">
          <TextInput
            placeholder="Hae laitteella tai rajapinnalla…"
            value={filterText}
            onChange={setFilterText}
          />
        </FilterBar.Item>
      </FilterBar>

      <DataTable
        data={filtered}
        columns={columns}
        sortable
        resizable
        loading={!demoMode && result.isLoading}
      >
        <DataTable.Pagination defaultPageSize={20} />
      </DataTable>
    </div>
  );
}
