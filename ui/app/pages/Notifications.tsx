/**
 * Notifications page — customer auto-notification settings.
 */
import React from 'react';
import { NotificationSettings } from '../components/NotificationSettings';

export default function Notifications() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NotificationSettings />
    </div>
  );
}
