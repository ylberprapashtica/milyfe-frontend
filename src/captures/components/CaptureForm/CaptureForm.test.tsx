import { render, screen } from '@testing-library/react';
import { CaptureForm } from './CaptureForm';

describe('CaptureForm Component', () => {
  test('renders children', () => {
    render(
      <CaptureForm>
        <div>Test Content</div>
      </CaptureForm>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('displays error message when error prop is provided', () => {
    render(
      <CaptureForm error="Test error message">
        <div>Test Content</div>
      </CaptureForm>
    );
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('does not display error when error is null', () => {
    render(
      <CaptureForm error={null}>
        <div>Test Content</div>
      </CaptureForm>
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('does not display error when error is undefined', () => {
    render(
      <CaptureForm>
        <div>Test Content</div>
      </CaptureForm>
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});

