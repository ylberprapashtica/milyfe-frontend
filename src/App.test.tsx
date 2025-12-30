// Mock axios before any imports
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { capturesApi, Capture } from './services/api';

// Mock the API service
jest.mock('./services/api');

const mockCapturesApi = capturesApi as jest.Mocked<typeof capturesApi>;

describe('App Component', () => {
  const mockCaptures: Capture[] = [
    {
      id: 1,
      thought: 'First thought',
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
    },
    {
      id: 2,
      thought: 'Second thought',
      created_at: '2024-01-02T00:00:00.000000Z',
      updated_at: '2024-01-02T00:00:00.000000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders app title', () => {
    mockCapturesApi.getCaptures.mockResolvedValue([]);
    render(<App />);
    const titleElement = screen.getByText(/write your thought/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders input and capture button', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue([]);
    render(<App />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your thought/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /capture/i })).toBeInTheDocument();
    });
  });

  test('loads and displays captures on mount', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue(mockCaptures);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('First thought')).toBeInTheDocument();
      expect(screen.getByText('Second thought')).toBeInTheDocument();
    });

    expect(mockCapturesApi.getCaptures).toHaveBeenCalledTimes(1);
  });

  test('displays empty state when no captures', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue([]);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/no captures yet/i)).toBeInTheDocument();
    });
  });

  test('creates a new capture', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue([]);
    mockCapturesApi.createCapture.mockResolvedValue(mockCaptures[0]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your thought/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /capture/i })).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/enter your thought/i);
    const button = screen.getByRole('button', { name: /capture/i });

    await userEvent.type(input, 'New thought');
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockCapturesApi.createCapture).toHaveBeenCalledWith('New thought');
    });

    // After creation, getCaptures should be called again to refresh the list
    await waitFor(() => {
      expect(mockCapturesApi.getCaptures).toHaveBeenCalledTimes(2);
    });
  });

  test('creates capture on Enter key press', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue([]);
    mockCapturesApi.createCapture.mockResolvedValue(mockCaptures[0]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your thought/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/enter your thought/i);
    await userEvent.type(input, 'New thought{Enter}');

    await waitFor(() => {
      expect(mockCapturesApi.createCapture).toHaveBeenCalledWith('New thought');
    });
  });

  test('does not create capture with empty input', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue([]);

    render(<App />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /capture/i });
      expect(button).toBeDisabled();
    });
    expect(mockCapturesApi.createCapture).not.toHaveBeenCalled();
  });

  test('updates a capture', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue(mockCaptures);
    mockCapturesApi.updateCapture.mockResolvedValue({
      ...mockCaptures[0],
      thought: 'Updated thought',
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('First thought')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);

    const editInput = screen.getByDisplayValue('First thought');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Updated thought');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockCapturesApi.updateCapture).toHaveBeenCalledWith(1, 'Updated thought');
    });
  });

  test('cancels edit mode', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue(mockCaptures);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('First thought')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('First thought')).toBeInTheDocument();
    });

    expect(mockCapturesApi.updateCapture).not.toHaveBeenCalled();
  });

  test('deletes a capture', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue(mockCaptures);
    mockCapturesApi.deleteCapture.mockResolvedValue();

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('First thought')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockCapturesApi.deleteCapture).toHaveBeenCalledWith(1);
    });
  });

  test('does not delete capture when confirmation is cancelled', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue(mockCaptures);

    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('First thought')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    expect(mockCapturesApi.deleteCapture).not.toHaveBeenCalled();
  });

  test('displays error message on create failure', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue([]);
    mockCapturesApi.createCapture.mockRejectedValue(new Error('API Error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your thought/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /capture/i })).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/enter your thought/i);
    const button = screen.getByRole('button', { name: /capture/i });

    await userEvent.type(input, 'New thought');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/failed to save capture/i)).toBeInTheDocument();
    });
  });

  test('displays error message on load failure', async () => {
    mockCapturesApi.getCaptures.mockRejectedValue(new Error('API Error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load captures/i)).toBeInTheDocument();
    });
  });

  test('displays error message on update failure', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue(mockCaptures);
    mockCapturesApi.updateCapture.mockRejectedValue(new Error('API Error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('First thought')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to update capture/i)).toBeInTheDocument();
    });
  });

  test('displays error message on delete failure', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue(mockCaptures);
    mockCapturesApi.deleteCapture.mockRejectedValue(new Error('API Error'));

    window.confirm = jest.fn(() => true);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('First thought')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/failed to delete capture/i)).toBeInTheDocument();
    });
  });

  test('shows loading state during operations', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue([]);
    mockCapturesApi.createCapture.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockCaptures[0]), 100))
    );

    render(<App />);

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your thought/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /capture/i })).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/enter your thought/i);
    const button = screen.getByRole('button', { name: /capture/i });

    await userEvent.type(input, 'New thought');
    await userEvent.click(button);

    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
    });
  });

  test('disables buttons during loading', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue(mockCaptures);
    mockCapturesApi.updateCapture.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockCaptures[0]), 100))
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('First thought')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    // All buttons should be disabled during loading
    await waitFor(() => {
      const allButtons = screen.getAllByRole('button');
      allButtons.forEach((button) => {
        if (button.textContent !== 'Save') {
          expect(button).toBeDisabled();
        }
      });
    });
  });

  test('displays capture dates', async () => {
    mockCapturesApi.getCaptures.mockResolvedValue(mockCaptures);
    render(<App />);

    await waitFor(() => {
      const dateElements = screen.getAllByText(/1\/1\/2024|1\/2\/2024/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });
});

