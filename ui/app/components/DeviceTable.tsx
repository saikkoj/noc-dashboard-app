/**
 * DeviceTable — network device inventory table with filtering.
 */
import React, { useMemo, useState } from 'react';
import { DataTable, type DataTableColumnDef } from '@dynatrace/strato-components-preview/tables';
import { FilterBar } from '@dynatrace/strato-components-preview/filters';
import { TextInput } from '@dynatrace/strato-components-preview/forms';
import { useDql } from '@dynatrace-sdk/react-hooks';
import { useDemoMode } from '../hooks/useDemoMode';
import { useTimeframe } from '../hooks/useTimeframe';
import { NETWORK_QUERIES } from '../data/networkQueries';
import { DEMO_DEVICES } from '../data/demoData';
import type { NetworkDevice } from '../types/network';
import {
  toNum, percentBarColor, formatTraffic, entityLinkStyle, openDeviceDetail,
  HEALTH_COLORS,
} from '../utils';

function PercentBar({ value, warn, crit }: { value: number; warn?: number; crit?: number }) {
  const color = percentBarColor(value, warn ?? 60, crit ?? 80);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 80 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', borderRadius: 3, background: color }} />
      </div>
      <span style={{ fontSize: 11, color, minWidth: 32, textAlign: 'right' }}>{value.toFixed(0)}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: NetworkDevice['status'] }) {
  const color = status === 'UP' ? HEALTH_COLORS.healthy : status === 'DEGRADED' ? HEALTH_COLORS.warning : HEALTH_COLORS.critical;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: 10,
      background: `${color}20`, color, textTransform: 'uppercase',
    }}>
      {status}
    </span>
  );
}

export function DeviceTable() {
  const { demoMode } = useDemoMode();
  const { dqlTimeframe } = useTimeframe();
  const [filterText, setFilterText] = useState('');

  const result = useDql(
    {
      query: NETWORK_QUERIES.deviceInventory,
      defaultTimeframeStart: dqlTimeframe.defaultTimeframeStart,
      defaultTimeframeEnd: dqlTimeframe.defaultTimeframeEnd,
    },
    { enabled: !demoMode, refetchInterval: 60_000 },
  );

  const liveDevices = useMemo<NetworkDevice[]>(() => {
    if (demoMode || !result.data?.records) return [];
    return (result.data.records as Record<string, unknown>[]).map(r => ({
      entityId: String(r['entity.id'] ?? r['id'] ?? ''),
      name: String(r['entity.name'] ?? r['name'] ?? ''),
      ip: String(r['ip'] ?? ''),
      type: Array.isArray(r['deviceType']) ? r['deviceType'].join(', ') : String(r['deviceType'] ?? ''),
      status: toNum(r['reachability']) >= 95 ? 'UP' as const : toNum(r['reachability']) >= 50 ? 'DEGRADED' as const : 'DOWN' as const,
      cpu: toNum(r['cpuPct']),
      memory: toNum(r['memPct']),
      problems: toNum(r['problems']),
      reachability: toNum(r['reachability']),
      traffic: toNum(r['traffic']),
      location: String(r['location'] ?? ''),
    }));
  }, [demoMode, result.data]);

  const devices = demoMode ? DEMO_DEVICES : liveDevices;

  const filtered = useMemo(() => {
    if (!filterText.trim()) return devices;
    const lc = filterText.toLowerCase();
    return devices.filter(d =>
      d.name.toLowerCase().includes(lc) ||
      d.ip.includes(lc) ||
      d.type.toLowerCase().includes(lc) ||
      (d.location ?? '').toLowerCase().includes(lc),
    );
  }, [devices, filterText]);

  const columns: DataTableColumnDef<NetworkDevice>[] = [
    {
      id: 'name',
      header: 'Device',
      accessor: 'name',
      cell: ({ value, rowData }: any) => (
        <span style={entityLinkStyle} onClick={() => openDeviceDetail(rowData.entityId)}>
          {value}
        </span>
      ),
    },
    { id: 'ip', header: 'IP', accessor: 'ip' },
    { id: 'type', header: 'Type', accessor: 'type' },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      cell: ({ value }: any) => <StatusBadge status={value} />,
    },
    {
      id: 'cpu',
      header: 'CPU',
      accessor: 'cpu',
      cell: ({ value }: any) => <PercentBar value={value} />,
    },
    {
      id: 'memory',
      header: 'Memory',
      accessor: 'memory',
      cell: ({ value }: any) => <PercentBar value={value} />,
    },
    {
      id: 'reachability',
      header: 'Reachability',
      accessor: 'reachability',
      cell: ({ value }: any) => <PercentBar value={value} warn={95} crit={80} />,
    },
    {
      id: 'traffic',
      header: 'Traffic',
      accessor: 'traffic',
      cell: ({ value }: any) => <span>{formatTraffic(value)}</span>,
    },
    {
      id: 'problems',
      header: 'Problems',
      accessor: 'problems',
      cell: ({ value }: any) => (
        <span style={{ color: value > 0 ? HEALTH_COLORS.critical : '#888' }}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FilterBar onFilterChange={() => {}}>
        <FilterBar.Item name="search" label="Search">
          <TextInput
            placeholder="Search by name, IP, type…"
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
