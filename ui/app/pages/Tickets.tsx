/**
 * Tickets page — full ticket management with list, detail, and create.
 */
import React from 'react';
import { TicketManager } from '../components/TicketManager';

export default function Tickets() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Tickets</div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Manage your tickets and track their status</div>
      </div>
      <TicketManager />
    </div>
  );
}
