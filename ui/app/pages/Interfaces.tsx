/**
 * Interfaces — network interface health page.
 */
import React from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Heading } from '@dynatrace/strato-components/typography';
import { InterfaceTable } from '../components/InterfaceTable';
import { modeBadgeStyle } from '../utils';
import { useDemoMode } from '../hooks/useDemoMode';

export function Interfaces() {
  const { demoMode } = useDemoMode();
  return (
    <Flex flexDirection="column" gap={12} padding={0}>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading level={4}>Interfaces</Heading>
        <span style={modeBadgeStyle(demoMode)}>{demoMode ? 'DEMO' : 'LIVE'}</span>
      </Flex>
      <InterfaceTable />
    </Flex>
  );
}
