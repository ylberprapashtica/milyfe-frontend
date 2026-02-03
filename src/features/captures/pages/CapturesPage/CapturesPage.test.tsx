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
import { CapturesPage } from './CapturesPage';
import { capturesService } from '@/features/captures/services/captures.service';
import { Capture } from '@/features/captures/types';

// Mock the API service
jest.mock('@/features/captures/services/captures.service');

const mockCapturesService = capturesService as jest.Mocked<typeof capturesService>;

// Mock the hooks
jest.mock('../../hooks/useCaptures', () => ({
  useCaptures: jest.fn(),
}));

jest.mock('../../hooks/useCapture', () => ({
  useCapture: jest.fn(),
}));

import { useCaptures } from '../../hooks/useCaptures';
import { useCapture } from '../../hooks/useCapture';

const mockUseCaptures = useCaptures as jest.MockedFunction<typeof useCaptures>;
const mockUseCapture = useCapture as jest.MockedFunction<typeof useCapture>;

describe('CapturesPage Component', () => {
  const mockCaptures: Capture[] = [
    {
      id: 1,
      content: 'First thought',
      title: 'First Title',
      slug: 'first-title',
      tags: [],
      capture_status_id: 1,
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
    },
    {
      id: 2,
      content: 'Second thought',
      title: 'Second Title',
      slug: 'second-title',
      tags: [],
      capture_status_id: 1,
      created_at: '2024-01-02T00:00:00.000000Z',
      updated_at: '2024-01-02T00:00:00.000000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCapture.mockReturnValue({
      loading: false,
      error: null,
      updateCapture: jest.fn().mockResolvedValue(undefined),
      deleteCapture: jest.fn().mockResolvedValue(undefined),
    });
  });

  test('renders page title', () => {
    mockUseCaptures.mockReturnValue({
      captures: [],
      loading: false,
      error: null,
      reload: jest.fn().mockResolvedValue(undefined),
      createCapture: jest.fn().mockResolvedValue(undefined),
    });

    render(<CapturesPage />);
    const titleElement = screen.getByText(/write your thought/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders capture input form', () => {
    mockUseCaptures.mockReturnValue({
      captures: mockCaptures,
      loading: false,
      error: null,
      reload: jest.fn().mockResolvedValue(undefined),
      createCapture: jest.fn().mockResolvedValue(undefined),
    });

    render(<CapturesPage />);

    expect(screen.getByPlaceholderText(/enter your thought/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /capture/i })).toBeInTheDocument();
  });

  test('displays error message', () => {
    mockUseCaptures.mockReturnValue({
      captures: [],
      loading: false,
      error: 'Failed to load captures',
      reload: jest.fn().mockResolvedValue(undefined),
      createCapture: jest.fn().mockResolvedValue(undefined),
    });

    render(<CapturesPage />);
    expect(screen.getByText('Failed to load captures')).toBeInTheDocument();
  });

  test('creates a new capture', async () => {
    const mockCreateCapture = jest.fn().mockResolvedValue(undefined);
    mockUseCaptures.mockReturnValue({
      captures: [],
      loading: false,
      error: null,
      reload: jest.fn().mockResolvedValue(undefined),
      createCapture: mockCreateCapture,
    });

    render(<CapturesPage />);

    const input = screen.getByPlaceholderText(/enter your thought/i);
    const button = screen.getByRole('button', { name: /capture/i });

    await userEvent.type(input, 'New thought');
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockCreateCapture).toHaveBeenCalledWith('New thought');
    });
  });
});

