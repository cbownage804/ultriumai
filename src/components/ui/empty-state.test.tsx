/**
 * EmptyState Component Tests
 * 
 * Run with: npx vitest run src/components/ui/empty-state.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { EmptyState } from './empty-state';

// Simple mock icon for testing to avoid Lucide issues
const MockIcon = ({ className }: { className?: string }) => (
  <svg data-testid="mock-icon" className={className}>
    <path d="M0 0h24v24H0z" />
  </svg>
);

describe('EmptyState', () => {
  it('renders with title and description', () => {
    render(
      <EmptyState
        icon={MockIcon}
        title="No documents"
        description="Get started by creating a new document"
      />
    );

    expect(screen.getByText('No documents')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating a new document')).toBeInTheDocument();
  });

  it('renders primary action button', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        icon={MockIcon}
        title="No documents"
        action={{
          label: 'Create Document',
          onClick: handleClick,
        }}
      />
    );

    const button = screen.getByRole('button', { name: 'Create Document' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders secondary action button', () => {
    const handleSecondary = vi.fn();
    render(
      <EmptyState
        icon={MockIcon}
        title="No documents"
        secondaryAction={{
          label: 'Learn More',
          onClick: handleSecondary,
        }}
      />
    );

    const button = screen.getByRole('button', { name: 'Learn More' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleSecondary).toHaveBeenCalledTimes(1);
  });

  it('renders action button with variant', () => {
    render(
      <EmptyState
        icon={MockIcon}
        title="No documents"
        action={{
          label: 'Add New',
          onClick: vi.fn(),
          variant: 'secondary',
        }}
      />
    );

    expect(screen.getByRole('button', { name: 'Add New' })).toBeInTheDocument();
  });

  it('renders icon correctly', () => {
    render(
      <EmptyState
        icon={MockIcon}
        title="Test Title"
      />
    );

    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('renders custom className', () => {
    const { container } = render(
      <EmptyState
        icon={MockIcon}
        title="Test"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders without description', () => {
    render(
      <EmptyState
        icon={MockIcon}
        title="Only Title"
      />
    );

    expect(screen.getByText('Only Title')).toBeInTheDocument();
  });
});
