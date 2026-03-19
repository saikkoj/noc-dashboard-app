/**
 * SelfService — diagnostics & ticketing self-service page.
 * Users can run network checks, view results, and create tickets.
 */
import React, { useState, useCallback } from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Heading, Paragraph } from '@dynatrace/strato-components/typography';
import { Button } from '@dynatrace/strato-components/buttons';
import { TextInput } from '@dynatrace/strato-components-preview/forms';
import { SelectV2 } from '@dynatrace/strato-components-preview/forms';
import { modeBadgeStyle, HEALTH_COLORS, BRAND_PRIMARY } from '../utils';
import { useDemoMode } from '../hooks/useDemoMode';

type DiagStatus = 'idle' | 'running' | 'done';

interface DiagResult {
  check: string;
  status: 'ok' | 'warning' | 'fail';
  detail: string;
  ms: number;
}

const CHECK_TYPES = [
  { value: 'ping', label: 'Ping Test' },
  { value: 'traceroute', label: 'Traceroute' },
  { value: 'dns', label: 'DNS Lookup' },
  { value: 'port', label: 'Port Test' },
  { value: 'snmp', label: 'SNMP Reachability' },
];

function fakeDiagnostics(target: string, checkType: string): DiagResult[] {
  const base: DiagResult[] = [
    { check: 'DNS Resolution', status: 'ok', detail: `${target} → 10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, ms: 12 },
    { check: 'ICMP ping', status: 'ok', detail: '4/4 packets, 0% loss', ms: 28 },
    { check: 'RTT Average', status: 'ok', detail: '3.2 ms', ms: 3 },
  ];

  if (checkType === 'traceroute') {
    base.push(
      { check: 'Hop 1', status: 'ok', detail: '10.0.0.1 — 1.2ms', ms: 1 },
      { check: 'Hop 2', status: 'ok', detail: '172.16.0.1 — 2.8ms', ms: 3 },
      { check: 'Hop 3', status: 'warning', detail: '192.168.1.1 — 45ms (high latency)', ms: 45 },
      { check: 'Hop 4', status: 'ok', detail: `${target} — 5.1ms`, ms: 5 },
    );
  }
  if (checkType === 'port') {
    base.push(
      { check: 'Port 22 (SSH)', status: 'ok', detail: 'Open', ms: 15 },
      { check: 'Port 443 (HTTPS)', status: 'ok', detail: 'Open', ms: 18 },
      { check: 'Port 161 (SNMP)', status: 'warning', detail: 'Timeout', ms: 5000 },
    );
  }
  if (checkType === 'snmp') {
    base.push(
      { check: 'SNMP v2c', status: Math.random() > 0.5 ? 'ok' : 'fail', detail: Math.random() > 0.5 ? 'Responds' : 'No response', ms: 2000 },
      { check: 'sysName', status: 'ok', detail: target, ms: 50 },
    );
  }

  return base;
}

export function SelfService() {
  const { demoMode } = useDemoMode();
  const [target, setTarget] = useState('');
  const [checkType, setCheckType] = useState('ping');
  const [diagStatus, setDiagStatus] = useState<DiagStatus>('idle');
  const [results, setResults] = useState<DiagResult[]>([]);
  const [ticketNote, setTicketNote] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  const runDiag = useCallback(() => {
    if (!target.trim()) return;
    setDiagStatus('running');
    setResults([]);
    setTicketSent(false);
    // Simulate async diagnostics
    setTimeout(() => {
      setResults(fakeDiagnostics(target.trim(), checkType));
      setDiagStatus('done');
    }, 1500);
  }, [target, checkType]);

  const createTicket = useCallback(() => {
    setTicketSent(true);
  }, []);

  const statusColor = (s: DiagResult['status']) =>
    s === 'ok' ? HEALTH_COLORS.healthy : s === 'warning' ? HEALTH_COLORS.warning : HEALTH_COLORS.critical;

  const statusLabel = (s: DiagResult['status']) =>
    s === 'ok' ? 'OK' : s === 'warning' ? 'WARNING' : 'ERROR';

  return (
    <Flex flexDirection="column" gap={16} padding={0}>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading level={4}>Self-Service</Heading>
        <span style={modeBadgeStyle(demoMode)}>{demoMode ? 'DEMO' : 'LIVE'}</span>
      </Flex>

      <Paragraph>
        Run network diagnostics and create a support ticket if needed.
      </Paragraph>

      {/* Diagnostic form */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: 12, alignItems: 'end',
        background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8,
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Target (IP or hostname)</div>
          <TextInput
            placeholder="e.g. 10.0.1.1 or hel-core-rtr-01"
            value={target}
            onChange={setTarget}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Check Type</div>
          <SelectV2
            value={checkType}
            onChange={(val: string) => setCheckType(val)}
          >
            {CHECK_TYPES.map(c => (
              <SelectV2.Option key={c.value} value={c.value}>{c.label}</SelectV2.Option>
            ))}
          </SelectV2>
        </div>
        <Button
          onClick={runDiag}
          disabled={!target.trim() || diagStatus === 'running'}
          color="primary"
        >
          {diagStatus === 'running' ? 'Testing…' : 'Run Test'}
        </Button>
      </div>

      {/* Running indicator */}
      {diagStatus === 'running' && (
        <div style={{ textAlign: 'center', padding: 24, color: '#888' }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>Running diagnostics…</div>
          <div style={{ width: 120, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', margin: '0 auto', overflow: 'hidden' }}>
            <div style={{
              width: '40%', height: '100%', background: BRAND_PRIMARY, borderRadius: 2,
              animation: 'slideRight 1s ease-in-out infinite alternate',
            }} />
          </div>
        </div>
      )}

      {/* Results */}
      {diagStatus === 'done' && results.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, fontSize: 13, color: '#fff' }}>
            Results — {target}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ color: '#888', textAlign: 'left' }}>
                <th style={{ padding: '8px 16px', fontWeight: 500 }}>Check</th>
                <th style={{ padding: '8px 16px', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '8px 16px', fontWeight: 500 }}>Details</th>
                <th style={{ padding: '8px 16px', fontWeight: 500, textAlign: 'right' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 16px', color: '#ccc' }}>{r.check}</td>
                  <td style={{ padding: '8px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: 10,
                      background: `${statusColor(r.status)}20`, color: statusColor(r.status),
                    }}>
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td style={{ padding: '8px 16px', color: '#aaa' }}>{r.detail}</td>
                  <td style={{ padding: '8px 16px', color: '#888', textAlign: 'right' }}>{r.ms}ms</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Ticket creation */}
          <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Create Ticket</div>
            {ticketSent ? (
              <div style={{
                padding: 12, background: 'rgba(42,176,111,0.1)', borderRadius: 6,
                color: HEALTH_COLORS.healthy, fontSize: 13,
              }}>
                ✓ Ticket created successfully. You will receive email confirmation.
              </div>
            ) : (
              <Flex flexDirection="column" gap={8}>
                <TextInput
                  placeholder="Additional problem details…"
                  value={ticketNote}
                  onChange={setTicketNote}
                />
                <Flex gap={8}>
                  <Button onClick={createTicket} color="primary">
                    Create Ticket
                  </Button>
                  <Button onClick={() => { setResults([]); setDiagStatus('idle'); }} variant="default">
                    Clear
                  </Button>
                </Flex>
              </Flex>
            )}
          </div>
        </div>
      )}
    </Flex>
  );
}
