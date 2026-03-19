/**
 * Devices — network device inventory page.
 */
import React from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Heading } from '@dynatrace/strato-components/typography';
import { DeviceTable } from '../components/DeviceTable';
import { modeBadgeStyle } from '../utils';
import { useDemoMode } from '../hooks/useDemoMode';

export function Devices() {
  const { demoMode } = useDemoMode();
  return (
    <Flex flexDirection="column" gap={12} padding={0}>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading level={4}>Network Devices</Heading>
        <span style={modeBadgeStyle(demoMode)}>{demoMode ? 'DEMO' : 'LIVE'}</span>
      </Flex>
      <DeviceTable />
    </Flex>
  );
}
