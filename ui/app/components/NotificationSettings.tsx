/**
 * NotificationSettings — customer-configurable auto-notification rules.
 */
import React, { useState } from 'react';
import type { NotificationRule } from '../types/network';
import {
  DEMO_NOTIFICATION_RULES,
  NOTIFICATION_METRIC_LABELS,
  CHANNEL_LABELS,
} from '../data/customerData';

type Channel = NotificationRule['channels'][number];

const ALL_CHANNELS: Channel[] = ['email', 'sms', 'teams', 'webhook'];

export function NotificationSettings() {
  const [rules, setRules] = useState<NotificationRule[]>(DEMO_NOTIFICATION_RULES);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const toggle = (id: string) => setExpandedId(prev => (prev === id ? null : id));

  const updateRule = (id: string, patch: Partial<NotificationRule>) => {
    setRules(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
    setSaved(false);
  };

  const toggleChannel = (id: string, ch: Channel) => {
    setRules(prev => prev.map(r => {
      if (r.id !== id) return r;
      const channels = r.channels.includes(ch)
        ? r.channels.filter(c => c !== ch)
        : [...r.channels, ch];
      return { ...r, channels };
    }));
    setSaved(false);
  };

  const handleSave = () => setSaved(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Notification Settings</div>
          <div style={{ fontSize: 11, color: '#888' }}>Manage automatic alerts for your services</div>
        </div>
        <button onClick={handleSave} style={{
          padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
          background: saved ? '#2ab06f' : '#FF2D8D', color: '#fff', fontSize: 12, fontWeight: 600,
          transition: 'background 0.3s',
        }}>
          {saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>

      {/* Rules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rules.map(rule => {
          const isExpanded = expandedId === rule.id;
          const metricLabel = NOTIFICATION_METRIC_LABELS[rule.metric] ?? rule.metric;
          return (
            <div key={rule.id} style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 10,
              border: `1px solid ${rule.enabled ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)'}`,
              overflow: 'hidden',
            }}>
              {/* Row header */}
              <button onClick={() => toggle(rule.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: '12px 14px', cursor: 'pointer',
                background: 'transparent', border: 'none', color: '#ccc',
              }}>
                {/* Enable toggle */}
                <span
                  onClick={(e) => { e.stopPropagation(); updateRule(rule.id, { enabled: !rule.enabled }); }}
                  style={{
                    width: 36, height: 20, borderRadius: 10, position: 'relative', cursor: 'pointer',
                    background: rule.enabled ? 'rgba(42,176,111,0.3)' : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2, left: rule.enabled ? 18 : 2,
                    width: 16, height: 16, borderRadius: 8,
                    background: rule.enabled ? '#2ab06f' : '#666',
                    transition: 'left 0.2s, background 0.2s',
                  }} />
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, opacity: rule.enabled ? 1 : 0.5 }}>{metricLabel}</div>
                  <div style={{ fontSize: 10, color: '#777' }}>
                    Raja: {rule.thresholdPct}% · {rule.channels.map(c => CHANNEL_LABELS[c]).join(', ')}
                    {rule.autoEscalate && ' · Auto-eskalaatio'}
                  </div>
                </div>

                <span style={{ color: '#555', fontSize: 12, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
              </button>

              {/* Expanded settings */}
              {isExpanded && (
                <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }} />

                  {/* Threshold */}
                  <div>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Alert Threshold (%)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="range" min={50} max={99} step={1} value={rule.thresholdPct}
                        onChange={e => updateRule(rule.id, { thresholdPct: Number(e.target.value) })}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', minWidth: 36, textAlign: 'right' }}>
                        {rule.thresholdPct}%
                      </span>
                    </div>
                  </div>

                  {/* Channels */}
                  <div>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>Ilmoituskanavat</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {ALL_CHANNELS.map(ch => {
                        const active = rule.channels.includes(ch);
                        return (
                          <button key={ch} onClick={() => toggleChannel(rule.id, ch)} style={{
                            padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                            border: active ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
                            background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                            color: active ? '#3B82F6' : '#666',
                          }}>{CHANNEL_LABELS[ch]}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cooldown */}
                  <div>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Alert Interval (minutes)</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[5, 15, 30, 60, 120].map(mins => (
                        <button key={mins} onClick={() => updateRule(rule.id, { cooldownMinutes: mins })} style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                          border: rule.cooldownMinutes === mins ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
                          background: rule.cooldownMinutes === mins ? 'rgba(59,130,246,0.12)' : 'transparent',
                          color: rule.cooldownMinutes === mins ? '#3B82F6' : '#666',
                        }}>{mins} min</button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-escalate */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      onClick={() => updateRule(rule.id, { autoEscalate: !rule.autoEscalate })}
                      style={{
                        width: 36, height: 20, borderRadius: 10, position: 'relative', cursor: 'pointer',
                        background: rule.autoEscalate ? 'rgba(253,130,50,0.3)' : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.2s',
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 2, left: rule.autoEscalate ? 18 : 2,
                        width: 16, height: 16, borderRadius: 8,
                        background: rule.autoEscalate ? '#fd8232' : '#666',
                        transition: 'left 0.2s, background 0.2s',
                      }} />
                    </span>
                    <div>
                      <div style={{ fontSize: 12, color: '#ccc' }}>Automaattinen eskalaatio</div>
                      <div style={{ fontSize: 10, color: '#666' }}>Auto-create ticket if alert is not acknowledged</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
