import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

  it('renders when open', async () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        Modal content
      </Modal>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });
  });

  it('renders title', async () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="My Modal Title">
        Content
      </Modal>
    );

    await waitFor(() => {
      expect(screen.getByText('My Modal Title')).toBeInTheDocument();
    });
  });

  it('renders children', async () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Title">
        <div data-testid="child-content">Child content</div>
      </Modal>
    );

    await waitFor(() => {
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  it('renders modal content', async () => {
    // Test that different sizes render correctly by checking the modal is visible
    render(
      <Modal isOpen={true} onClose={() => {}} title="Title" size="sm">
        Content
      </Modal>
    );

    await waitFor(() => {
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Title">
        Content
      </Modal>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});