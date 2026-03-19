/**
 * Incidents — full incident management page with filtering.
 */

import React from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Heading, Paragraph } from '@dynatrace/strato-components/typography';
import { IncidentList } from '../components/IncidentList';
import { DEMO_INCIDENTS } from '../data/demoData';

export function Incidents() {
  return (
    <Flex flexDirection="column" gap={16} padding={0}>
      <Heading level={4}>Incidents</Heading>
      <Paragraph>Incident management with filtering and status updates.</Paragraph>
      <IncidentList incidents={DEMO_INCIDENTS} title="All Incidents" />
    </Flex>
  );
}
