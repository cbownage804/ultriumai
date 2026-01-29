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
import { FileText } from 'lucide-react';

describe('EmptyState', () => {
  it('renders with title and description', () => {
    render(
      <EmptyState
        icon={FileText}
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
        icon={FileText}
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
        icon={FileText}
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
        icon={FileText}
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

  it('applies correct size variant styles', () => {
    const { rerender } = render(
      <EmptyState
        icon={FileText}
        title="Small Title"
        size="sm"
      />
    );

    // Check for small size class
    expect(screen.getByText('Small Title').className).toContain('text-lg');

    rerender(
      <EmptyState
        icon={FileText}
        title="Large Title"
        size="lg"
      />
    );

    // Check for large size class
    expect(screen.getByText('Large Title').className).toContain('text-2xl');
  });

  it('renders custom className', () => {
    const { container } = render(
      <EmptyState
        icon={FileText}
        title="Test"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders without description', () => {
    render(
      <EmptyState
        icon={FileText}
        title="Only Title"
      />
    );

    expect(screen.getByText('Only Title')).toBeInTheDocument();
  });
});
