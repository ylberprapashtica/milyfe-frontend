import { render, screen } from '@testing-library/react';
import App from './App';

test('renders save your thought title', () => {
  render(<App />);
  const titleElement = screen.getByText(/save your thought/i);
  expect(titleElement).toBeInTheDocument();
});

