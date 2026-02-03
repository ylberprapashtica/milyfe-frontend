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

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { CaptureDetailPage } from './CaptureDetailPage';
import { capturesService } from '@/features/captures/services/captures.service';
import { Capture } from '@/features/captures/types';

// Mock the API service
jest.mock('@/features/captures/services/captures.service');

// Mock the hooks
jest.mock('../../hooks/useCapture', () => ({
  useCapture: jest.fn(),
}));

// Mock the CaptureItem component
jest.mock('../../components/CaptureItem', () => ({
  CaptureItem: ({ capture, onUpdate, onDelete }: any) => (
    <div>
      <div>{capture.thought}</div>
      <button onClick={() => onUpdate(capture.id, 'Updated')}>Update</button>
      <button onClick={() => onDelete(capture.id)}>Delete</button>
    </div>
  ),
}));

const mockCapturesService = capturesService as jest.Mocked<typeof capturesService>;
import { useCapture } from '../../hooks/useCapture';
const mockUseCapture = useCapture as jest.MockedFunction<typeof useCapture>;

describe('CaptureDetailPage Component', () => {
  const mockCapture: Capture = {
    id: 1,
    content: 'Test thought',
    title: 'Test Title',
    slug: 'test-title',
    tags: [],
    capture_status_id: 1,
    created_at: '2024-01-01T00:00:00.000000Z',
    updated_at: '2024-01-01T00:00:00.000000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '1' });
    mockUseCapture.mockReturnValue({
      loading: false,
      error: null,
      updateCapture: jest.fn().mockResolvedValue(undefined),
      deleteCapture: jest.fn().mockResolvedValue(undefined),
    });
  });

  test('displays loading state initially', () => {
    mockCapturesService.getCapture.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <CaptureDetailPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading capture/i)).toBeInTheDocument();
  });

  test('loads and displays capture', async () => {
    mockCapturesService.getCapture.mockResolvedValue(mockCapture);

    render(
      <BrowserRouter>
        <CaptureDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test thought')).toBeInTheDocument();
    });

    expect(screen.getByText(/capture details/i)).toBeInTheDocument();
  });

  test('displays error when capture is not found', async () => {
    mockCapturesService.getCapture.mockRejectedValue(new Error('Not found'));

    render(
      <BrowserRouter>
        <CaptureDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load capture/i)).toBeInTheDocument();
    });
  });

  test('displays error when id is invalid', () => {
    mockUseParams.mockReturnValue({ id: undefined });

    render(
      <BrowserRouter>
        <CaptureDetailPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/invalid capture id/i)).toBeInTheDocument();
  });

  test('navigates back when back button is clicked', async () => {
    mockCapturesService.getCapture.mockResolvedValue(mockCapture);

    render(
      <BrowserRouter>
        <CaptureDetailPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test thought')).toBeInTheDocument();
    });

    const backButton = screen.getByText(/back to captures/i);
    await userEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

