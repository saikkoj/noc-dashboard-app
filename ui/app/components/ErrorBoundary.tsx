/**
 * ErrorBoundary — catches React render errors with a reset button.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Heading, Paragraph } from '@dynatrace/strato-components/typography';
import { Button } from '@dynatrace/strato-components/buttons';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Flex flexDirection="column" alignItems="center" justifyContent="center" gap={16} style={{ padding: 40 }}>
          <Heading level={3}>Something went wrong</Heading>
          <Paragraph>{this.state.error.message}</Paragraph>
          <Button onClick={() => this.setState({ error: null })}>Try Again</Button>
        </Flex>
      );
    }
    return this.props.children;
  }
}
