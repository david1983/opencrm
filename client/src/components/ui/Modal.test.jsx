import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        Modal content
      </Modal>
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        Modal content
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="My Modal Title">
        Content
      </Modal>
    );

    expect(screen.getByText('My Modal Title')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Title">
        <div data-testid="child-content">Child content</div>
      </Modal>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders with small size', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="Title" size="sm">
        Content
      </Modal>
    );

    // Check for max-w-sm class in the panel
    const panel = container.querySelector('[class*="max-w"]');
    expect(panel).toHaveClass('max-w-sm');
  });

  it('renders with large size', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="Title" size="lg">
        Content
      </Modal>
    );

    const panel = container.querySelector('[class*="max-w"]');
    expect(panel).toHaveClass('max-w-lg');
  });

  it('renders with medium size by default', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="Title">
        Content
      </Modal>
    );

    const panel = container.querySelector('[class*="max-w"]');
    expect(panel).toHaveClass('max-w-md');
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Title">
        Content
      </Modal>
    );

    // Find the close button (it contains an X icon)
    const closeButton = screen.getByRole('button', { name: /close/i }) ||
      screen.getAllByRole('button').find(btn => btn.querySelector('svg'));

    if (closeButton) {
      await userEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });
});