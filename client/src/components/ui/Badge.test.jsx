import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, LeadStatusBadge, StageBadge, PriorityBadge, TaskStatusBadge } from './Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-gray-100');
    expect(badge).toHaveClass('text-gray-800');
  });

  it('applies primary variant', () => {
    render(<Badge variant="primary">Primary</Badge>);
    const badge = screen.getByText('Primary');
    expect(badge).toHaveClass('bg-primary-100');
    expect(badge).toHaveClass('text-primary-800');
  });

  it('applies success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
  });

  it('applies warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    const badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-yellow-100');
    expect(badge).toHaveClass('text-yellow-800');
  });

  it('applies danger variant', () => {
    render(<Badge variant="danger">Danger</Badge>);
    const badge = screen.getByText('Danger');
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-800');
  });

  it('applies info variant', () => {
    render(<Badge variant="info">Info</Badge>);
    const badge = screen.getByText('Info');
    expect(badge).toHaveClass('bg-blue-100');
    expect(badge).toHaveClass('text-blue-800');
  });

  it('applies small size', () => {
    render(<Badge size="sm">Small</Badge>);
    const badge = screen.getByText('Small');
    expect(badge).toHaveClass('px-2');
    expect(badge).toHaveClass('py-0.5');
    expect(badge).toHaveClass('text-xs');
  });

  it('applies large size', () => {
    render(<Badge size="lg">Large</Badge>);
    const badge = screen.getByText('Large');
    expect(badge).toHaveClass('px-3');
    expect(badge).toHaveClass('py-1');
  });

  it('applies medium size by default', () => {
    render(<Badge>Medium</Badge>);
    const badge = screen.getByText('Medium');
    expect(badge).toHaveClass('px-2.5');
    expect(badge).toHaveClass('text-sm');
  });
});

describe('LeadStatusBadge', () => {
  it('renders with correct variant for New', () => {
    render(<LeadStatusBadge status="New" />);
    const badge = screen.getByText('New');
    expect(badge).toHaveClass('bg-blue-100');
  });

  it('renders with correct variant for Contacted', () => {
    render(<LeadStatusBadge status="Contacted" />);
    const badge = screen.getByText('Contacted');
    expect(badge).toHaveClass('bg-yellow-100');
  });

  it('renders with correct variant for Qualified', () => {
    render(<LeadStatusBadge status="Qualified" />);
    const badge = screen.getByText('Qualified');
    expect(badge).toHaveClass('bg-green-100');
  });

  it('renders with correct variant for Unqualified', () => {
    render(<LeadStatusBadge status="Unqualified" />);
    const badge = screen.getByText('Unqualified');
    expect(badge).toHaveClass('bg-red-100');
  });
});

describe('StageBadge', () => {
  it('renders with correct variant for Prospecting', () => {
    render(<StageBadge stage="Prospecting" />);
    expect(screen.getByText('Prospecting')).toBeInTheDocument();
  });

  it('renders with correct variant for Closed Won', () => {
    render(<StageBadge stage="Closed Won" />);
    const badge = screen.getByText('Closed Won');
    expect(badge).toHaveClass('bg-green-100');
  });

  it('renders with correct variant for Closed Lost', () => {
    render(<StageBadge stage="Closed Lost" />);
    const badge = screen.getByText('Closed Lost');
    expect(badge).toHaveClass('bg-red-100');
  });
});

describe('PriorityBadge', () => {
  it('renders with correct variant for High', () => {
    render(<PriorityBadge priority="High" />);
    const badge = screen.getByText('High');
    expect(badge).toHaveClass('bg-red-100');
  });

  it('renders with correct variant for Normal', () => {
    render(<PriorityBadge priority="Normal" />);
    const badge = screen.getByText('Normal');
    expect(badge).toHaveClass('bg-primary-100');
  });

  it('renders with correct variant for Low', () => {
    render(<PriorityBadge priority="Low" />);
    const badge = screen.getByText('Low');
    expect(badge).toHaveClass('bg-gray-100');
  });
});

describe('TaskStatusBadge', () => {
  it('renders with correct variant for Not Started', () => {
    render(<TaskStatusBadge status="Not Started" />);
    expect(screen.getByText('Not Started')).toBeInTheDocument();
  });

  it('renders with correct variant for In Progress', () => {
    render(<TaskStatusBadge status="In Progress" />);
    const badge = screen.getByText('In Progress');
    expect(badge).toHaveClass('bg-yellow-100');
  });

  it('renders with correct variant for Completed', () => {
    render(<TaskStatusBadge status="Completed" />);
    const badge = screen.getByText('Completed');
    expect(badge).toHaveClass('bg-green-100');
  });
});