import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaptureInput } from './CaptureInput';

describe('CaptureInput Component', () => {
  const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders input and button', () => {
    render(<CaptureInput onSubmit={mockOnSubmit} />);
    expect(screen.getByPlaceholderText(/enter your thought/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /capture/i })).toBeInTheDocument();
  });

  test('calls onSubmit when button is clicked', async () => {
    render(<CaptureInput onSubmit={mockOnSubmit} />);

    const input = screen.getByPlaceholderText(/enter your thought/i);
    const button = screen.getByRole('button', { name: /capture/i });

    await userEvent.type(input, 'New thought');
    await userEvent.click(button);

    expect(mockOnSubmit).toHaveBeenCalledWith('New thought');
  });

  test('calls onSubmit when Enter key is pressed', async () => {
    render(<CaptureInput onSubmit={mockOnSubmit} />);

    const input = screen.getByPlaceholderText(/enter your thought/i);
    await userEvent.type(input, 'New thought{Enter}');

    expect(mockOnSubmit).toHaveBeenCalledWith('New thought');
  });

  test('disables button when input is empty', () => {
    render(<CaptureInput onSubmit={mockOnSubmit} />);
    const button = screen.getByRole('button', { name: /capture/i });
    expect(button).toBeDisabled();
  });

  test('disables input and button when disabled prop is true', () => {
    render(<CaptureInput onSubmit={mockOnSubmit} disabled={true} />);
    const input = screen.getByPlaceholderText(/enter your thought/i);
    const button = screen.getByRole('button', { name: /saving/i });
    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  test('shows loading text when disabled', () => {
    render(<CaptureInput onSubmit={mockOnSubmit} disabled={true} />);
    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
  });
});

