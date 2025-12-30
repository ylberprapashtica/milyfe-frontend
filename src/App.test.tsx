import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock the captures pages
jest.mock('./captures/pages/CapturesPage', () => ({
  CapturesPage: () => <div>CapturesPage</div>,
}));

jest.mock('./captures/pages/CaptureDetailPage', () => ({
  CaptureDetailPage: () => <div>CaptureDetailPage</div>,
}));

describe('App Component', () => {
  test('renders router', () => {
    render(<App />);
    // The router should be present
    expect(screen.getByText('CapturesPage')).toBeInTheDocument();
  });

  test('sets up routes correctly', () => {
    const { container } = render(<App />);
    // BrowserRouter should be present
    expect(container.querySelector('.App')).toBeInTheDocument();
  });
});
