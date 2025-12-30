import { ReactElement } from 'react';
import { useCaptures } from '../../hooks/useCaptures';
import { useCapture } from '../../hooks/useCapture';
import { CaptureInput } from '../../components/CaptureInput';
import { CaptureForm } from '../../components/CaptureForm';
import './CapturesPage.scss';

/**
 * Main page component for viewing and creating captures
 * 
 * This page orchestrates the capture list and creation functionality.
 * It uses the useCaptures hook for list operations and useCapture hook
 * for individual capture operations. The page displays an input form
 * for creating new captures and a list of existing captures.
 * 
 * @returns {ReactElement} The rendered captures page
 * 
 * @example
 * ```tsx
 * // Used in routing
 * <Route path="/" element={<CapturesPage />} />
 * ```
 */
export const CapturesPage = (): ReactElement => {
  const { loading, error, createCapture } = useCaptures();
  const { loading: updateLoading } = useCapture();

  /**
   * Handle capture creation
   */
  const handleCreate = async (thought: string): Promise<void> => {
    await createCapture(thought);
  };

  const isLoading = loading || updateLoading;

  return (
    <div className="captures-page">
      <div className="captures-page-container">
        <h1 className="captures-page-title">Write your Thought</h1>

        <CaptureForm error={error}>
          <CaptureInput
            onSubmit={handleCreate}
            disabled={isLoading}
            placeholder="Enter your thought..."
          />
        </CaptureForm>
      </div>
    </div>
  );
};

