/**
 * TicketManager — full support ticket list with create-new form and message thread view.
 */
import React, { useState, useMemo } from 'react';
import type { SupportTicket, TicketMessage, CustomerService } from '../types/network';
import {
  DEMO_TICKETS,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  DEMO_CUSTOMER_SERVICES,
  SERVICE_TYPE_LABELS,
} from '../data/customerData';
import { formatAge, BRAND_PRIMARY } from '../utils';
import { useDemoMode } from '../hooks/useDemoMode';

/* ---------- Ticket List ---------- */

export function TicketManager() {
  const { demoMode } = useDemoMode();
  const [tickets, setTickets] = useState<SupportTicket[]>(DEMO_TICKETS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const displayTickets = demoMode ? tickets : [];

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return displayTickets;
    return displayTickets.filter(t => t.status === statusFilter);
  }, [displayTickets, statusFilter]);

  const selectedTicket = tickets.find(t => t.id === selectedId) ?? null;

  const handleCreate = (ticket: SupportTicket) => {
    setTickets(prev => [ticket, ...prev]);
    setShowCreate(false);
    setSelectedId(ticket.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {!demoMode && displayTickets.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No ticket data available</div>
          <div style={{ fontSize: 12 }}>Ticket management is provided in demo mode. Switch to Demo mode to see example data.</div>
        </div>
      ) : (
        <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'open', 'in-progress', 'waiting-customer', 'resolved', 'closed'].map(s => {
            const isActive = statusFilter === s;
            const meta = TICKET_STATUS_LABELS[s];
            const label = s === 'all' ? 'All' : (meta?.label ?? s);
            const count = s === 'all' ? displayTickets.length : displayTickets.filter(t => t.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '4px 12px', borderRadius: 14, cursor: 'pointer', fontSize: 11,
                  border: isActive ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
                  background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                  color: isActive ? '#3B82F6' : '#888',
                }}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
          background: BRAND_PRIMARY, color: '#fff', fontSize: 12, fontWeight: 600,
        }}>+ New Support Ticket</button>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map(t => (
            <TicketRow key={t.id} ticket={t} selected={t.id === selectedId} onClick={() => setSelectedId(t.id)} />
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>No support tickets</div>
          )}
        </div>

        {/* Detail */}
        {selectedTicket && (
          <TicketDetail ticket={selectedTicket} onClose={() => setSelectedId(null)} />
        )}
      </div>

      {/* Create modal */}
      {showCreate && <CreateTicketModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
        </>
      )}
    </div>
  );
}

/* ---------- Ticket Row ---------- */

function TicketRow({ ticket, selected, onClick }: { ticket: SupportTicket; selected: boolean; onClick: () => void }) {
  const statusMeta = TICKET_STATUS_LABELS[ticket.status];
  const priorityMeta = TICKET_PRIORITY_LABELS[ticket.priority];
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left',
        padding: '10px 12px', borderRadius: 8, cursor: 'pointer', width: '100%',
        background: selected ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
        border: selected ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          padding: '1px 6px', borderRadius: 8, fontSize: 9, fontWeight: 600,
          background: `${priorityMeta.color}20`, color: priorityMeta.color,
        }}>{priorityMeta.label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#ccc', flex: 1 }}>{ticket.title}</span>
        <span style={{
          padding: '1px 6px', borderRadius: 8, fontSize: 9,
          background: `${statusMeta.color}20`, color: statusMeta.color,
        }}>{statusMeta.label}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#666' }}>
        <span>{ticket.id}</span>
        <span>·</span>
        <span>{ticket.serviceName}</span>
        <span>·</span>
        <span>{formatAge(ticket.createdAt)}</span>
      </div>
    </button>
  );
}

/* ---------- Ticket Detail Panel ---------- */

function TicketDetail({ ticket, onClose }: { ticket: SupportTicket; onClose: () => void }) {
  const statusMeta = TICKET_STATUS_LABELS[ticket.status];
  const priorityMeta = TICKET_PRIORITY_LABELS[ticket.priority];
  return (
    <div style={{
      width: 360, minWidth: 320, overflowY: 'auto', padding: 16, borderRadius: 10,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 10, color: '#666' }}>{ticket.id}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{ticket.title}</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, background: `${statusMeta.color}20`, color: statusMeta.color }}>{statusMeta.label}</span>
        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, background: `${priorityMeta.color}20`, color: priorityMeta.color }}>{priorityMeta.label}</span>
      </div>
      <div style={{ fontSize: 12, color: '#999', lineHeight: 1.6, marginBottom: 16 }}>{ticket.description}</div>

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <MetaItem label="Service" value={ticket.serviceName ?? '—'} />
        <MetaItem label="Created" value={new Date(ticket.createdAt).toLocaleDateString('en-US')} />
        {ticket.resolvedAt && <MetaItem label="Resolved" value={new Date(ticket.resolvedAt).toLocaleDateString('en-US')} />}
        <MetaItem label="Messages" value={`${ticket.messages.length}`} />
      </div>

      {/* Messages */}
      <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 8 }}>Messages</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ticket.messages.map(m => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: TicketMessage }) {
  const isCustomer = message.authorRole === 'customer';
  return (
    <div style={{
      padding: '8px 10px', borderRadius: 8, fontSize: 12, lineHeight: 1.5,
      background: isCustomer ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)',
      borderLeft: `3px solid ${isCustomer ? '#3B82F6' : '#555'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#666', marginBottom: 4 }}>
        <span>{isCustomer ? 'You' : 'NOC Support'}</span>
        <span>{new Date(message.timestamp).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div style={{ color: '#ccc' }}>{message.content}</div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#666' }}>{label}</div>
      <div style={{ fontSize: 12, color: '#ccc' }}>{value}</div>
    </div>
  );
}

/* ---------- Create Ticket Modal ---------- */

const CATEGORIES: { value: SupportTicket['category']; label: string }[] = [
  { value: 'incident', label: 'Incident Report' },
  { value: 'bandwidth-request', label: 'Bandwidth' },
  { value: 'configuration', label: 'Configuration' },
  { value: 'billing', label: 'Billing' },
  { value: 'general', label: 'Other' },
];

const PRIORITIES: { value: SupportTicket['priority']; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#2ab06f' },
  { value: 'medium', label: 'Normal', color: '#3B82F6' },
  { value: 'high', label: 'High', color: '#fd8232' },
  { value: 'critical', label: 'Critical', color: '#dc172a' },
];

function CreateTicketModal({ onClose, onCreate }: { onClose: () => void; onCreate: (t: SupportTicket) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('incident');
  const [priority, setPriority] = useState<SupportTicket['priority']>('medium');
  const [serviceId, setServiceId] = useState(DEMO_CUSTOMER_SERVICES[0].id);

  const service = DEMO_CUSTOMER_SERVICES.find(s => s.id === serviceId);

  const handleSubmit = () => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    const newTicket: SupportTicket = {
      id: `TKT-${Date.now().toString(36).toUpperCase()}`,
      serviceId,
      serviceName: service?.name ?? 'Unknown',
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: 'open',
      createdAt: now,
      updatedAt: now,
      messages: [{
        id: `msg-${Date.now()}`,
        author: 'Me',
        authorRole: 'customer',
        content: description.trim(),
        timestamp: now,
      }],
      relatedIncidentIds: [],
    };
    onCreate(newTicket);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1a1a22', borderRadius: 12, padding: 24, width: 480,
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>New Support Ticket</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Service select */}
        <Field label="Service">
          <select value={serviceId} onChange={e => setServiceId(e.target.value)} style={selectStyle}>
            {DEMO_CUSTOMER_SERVICES.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({SERVICE_TYPE_LABELS[s.type]})</option>
            ))}
          </select>
        </Field>

        {/* Category */}
        <Field label="Kategoria">
          <div style={{ display: 'flex', gap: 6 }}>
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setCategory(c.value)} style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                border: category === c.value ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
                background: category === c.value ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: category === c.value ? '#3B82F6' : '#888',
              }}>{c.label}</button>
            ))}
          </div>
        </Field>

        {/* Priority */}
        <Field label="Prioriteetti">
          <div style={{ display: 'flex', gap: 6 }}>
            {PRIORITIES.map(p => (
              <button key={p.value} onClick={() => setPriority(p.value)} style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                border: priority === p.value ? `1px solid ${p.color}` : '1px solid rgba(255,255,255,0.1)',
                background: priority === p.value ? `${p.color}18` : 'transparent',
                color: priority === p.value ? p.color : '#888',
              }}>{p.label}</button>
            ))}
          </div>
        </Field>

        {/* Title */}
        <Field label="Otsikko">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Kuvaile ongelma lyhyesti…"
            style={inputStyle} />
        </Field>

        {/* Description */}
        <Field label="Kuvaus">
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Kerro tarkemmin ongelmasta…"
            rows={4} style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} />
        </Field>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={handleSubmit} disabled={!title.trim()} style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
            background: title.trim() ? BRAND_PRIMARY : '#555', color: '#fff', cursor: title.trim() ? 'pointer' : 'default',
            fontSize: 13, fontWeight: 600,
          }}>Submit Ticket</button>
          <button onClick={onClose} style={{
            padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent', color: '#999', cursor: 'pointer', fontSize: 13,
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
  color: '#ccc', fontSize: 12,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer',
};
