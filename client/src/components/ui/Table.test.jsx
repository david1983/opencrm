import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './Table';

describe('Table', () => {
  it('renders children', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td>Cell</td>
          </tr>
        </tbody>
      </Table>
    );
    expect(screen.getByText('Cell')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );
    const table = screen.getByRole('table');
    expect(table).toHaveClass('min-w-full');
    expect(table).toHaveClass('divide-y');
  });

  it('applies custom className', () => {
    render(
      <Table className="custom-table">
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );
    const table = screen.getByRole('table');
    expect(table).toHaveClass('custom-table');
  });
});

describe('TableHeader', () => {
  it('renders children', () => {
    render(
      <Table>
        <TableHeader>
          <th>Header</th>
        </TableHeader>
      </Table>
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(
      <Table>
        <TableHeader>
          <th>Header</th>
        </TableHeader>
      </Table>
    );
    const header = screen.getByText('Header').closest('thead');
    expect(header).toHaveClass('bg-gray-50');
  });
});

describe('TableBody', () => {
  it('renders children', () => {
    render(
      <Table>
        <TableBody>
          <tr>
            <td>Body content</td>
          </tr>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(
      <Table>
        <TableBody>
          <tr>
            <td>Content</td>
          </tr>
        </TableBody>
      </Table>
    );
    const body = screen.getByText('Content').closest('tbody');
    expect(body).toHaveClass('bg-white');
    expect(body).toHaveClass('divide-y');
  });
});

describe('TableRow', () => {
  it('renders children', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <td>Row content</td>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Row content')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(
      <Table>
        <TableBody>
          <TableRow onClick={handleClick}>
            <td>Clickable row</td>
          </TableRow>
        </TableBody>
      </Table>
    );

    const row = screen.getByText('Clickable row').closest('tr');
    await userEvent.click(row);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies cursor-pointer when onClick is provided', () => {
    render(
      <Table>
        <TableBody>
          <TableRow onClick={() => {}}>
            <td>Clickable</td>
          </TableRow>
        </TableBody>
      </Table>
    );
    const row = screen.getByText('Clickable').closest('tr');
    expect(row).toHaveClass('cursor-pointer');
    expect(row).toHaveClass('hover:bg-gray-50');
  });

  it('applies custom className', () => {
    render(
      <Table>
        <TableBody>
          <TableRow className="custom-row">
            <td>Custom</td>
          </TableRow>
        </TableBody>
      </Table>
    );
    const row = screen.getByText('Custom').closest('tr');
    expect(row).toHaveClass('custom-row');
  });
});

describe('TableHead', () => {
  it('renders children', () => {
    render(
      <Table>
        <TableHeader>
          <TableHead>Header Cell</TableHead>
        </TableHeader>
      </Table>
    );
    expect(screen.getByText('Header Cell')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(
      <Table>
        <TableHeader>
          <TableHead>Header</TableHead>
        </TableHeader>
      </Table>
    );
    const header = screen.getByText('Header');
    expect(header).toHaveClass('px-4');
    expect(header).toHaveClass('py-3');
    expect(header).toHaveClass('text-left');
    expect(header).toHaveClass('font-medium');
  });

  it('applies custom className', () => {
    render(
      <Table>
        <TableHeader>
          <TableHead className="custom-head">Header</TableHead>
        </TableHeader>
      </Table>
    );
    const header = screen.getByText('Header');
    expect(header).toHaveClass('custom-head');
  });
});

describe('TableCell', () => {
  it('renders children', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Cell content')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const cell = screen.getByText('Content');
    expect(cell).toHaveClass('px-4');
    expect(cell).toHaveClass('py-3');
    expect(cell).toHaveClass('text-sm');
  });

  it('applies custom className', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="custom-cell">Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const cell = screen.getByText('Content');
    expect(cell).toHaveClass('custom-cell');
  });
});

describe('Table composition', () => {
  it('renders a complete table', () => {
    render(
      <Table>
        <TableHeader>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});