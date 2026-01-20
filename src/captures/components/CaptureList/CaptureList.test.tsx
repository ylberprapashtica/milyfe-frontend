import { render, screen } from '@testing-library/react';
import { CaptureList } from './CaptureList';
import { Capture } from '../../types';

describe('CaptureList Component', () => {
  const mockCaptures: Capture[] = [
    {
      id: 1,
      content: 'First thought',
      title: 'First Title',
      slug: 'first-title',
      tags: [],
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
    },
    {
      id: 2,
      content: 'Second thought',
      title: 'Second Title',
      slug: 'second-title',
      tags: [],
      created_at: '2024-01-02T00:00:00.000000Z',
      updated_at: '2024-01-02T00:00:00.000000Z',
    },
  ];

  const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
  const mockOnDelete = jest.fn().mockResolvedValue(undefined);

  test('renders list title', () => {
    render(
      <CaptureList
        captures={mockCaptures}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText(/your captures/i)).toBeInTheDocument();
  });

  test('renders all captures', () => {
    render(
      <CaptureList
        captures={mockCaptures}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText('First thought')).toBeInTheDocument();
    expect(screen.getByText('Second thought')).toBeInTheDocument();
  });

  test('displays empty state when no captures', () => {
    render(
      <CaptureList
        captures={[]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText(/no captures yet/i)).toBeInTheDocument();
  });

  test('displays loading state', () => {
    render(
      <CaptureList
        captures={[]}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        loading={true}
      />
    );
    expect(screen.getByText(/loading captures/i)).toBeInTheDocument();
  });
});

