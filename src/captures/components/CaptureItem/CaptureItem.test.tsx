import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaptureItem } from './CaptureItem';
import { Capture } from '../../types';

describe('CaptureItem Component', () => {
  const mockCapture: Capture = {
    id: 1,
    content: 'Test thought',
    title: 'Test Title',
    slug: 'test-title',
    tags: [],
    created_at: '2024-01-01T00:00:00.000000Z',
    updated_at: '2024-01-01T00:00:00.000000Z',
  };

  const mockOnUpdate = jest.fn().mockResolvedValue(undefined);
  const mockOnDelete = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  test('renders capture thought', () => {
    render(
      <CaptureItem
        capture={mockCapture}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText('Test thought')).toBeInTheDocument();
  });

  test('renders edit and delete buttons', () => {
    render(
      <CaptureItem
        capture={mockCapture}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  test('enters edit mode when edit button is clicked', async () => {
    render(
      <CaptureItem
        capture={mockCapture}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    const editInput = screen.getByDisplayValue('Test thought');
    expect(editInput).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('calls onUpdate when save is clicked', async () => {
    render(
      <CaptureItem
        capture={mockCapture}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    const editInput = screen.getByDisplayValue('Test thought');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Updated thought');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    expect(mockOnUpdate).toHaveBeenCalledWith(1, 'Updated thought');
  });

  test('cancels edit mode when cancel is clicked', async () => {
    render(
      <CaptureItem
        capture={mockCapture}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(screen.getByText('Test thought')).toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  test('calls onDelete when delete button is clicked', async () => {
    render(
      <CaptureItem
        capture={mockCapture}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  test('does not delete when confirmation is cancelled', async () => {
    window.confirm = jest.fn(() => false);

    render(
      <CaptureItem
        capture={mockCapture}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    expect(mockOnDelete).not.toHaveBeenCalled();
  });
});

