import { useState, ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useCaptures } from '@/features/captures/hooks/useCaptures';
import { CaptureInput } from '@/features/captures/components/CaptureInput';
import { CaptureForm } from '@/features/captures/components/CaptureForm';
import './CreateNotePage.scss';

/**
 * Page component for creating new notes
 * 
 * This page provides a focused interface for creating new notes with title,
 * content, and tags. After successful creation, the form clears and shows
 * a success message. Users can navigate to the slipbox to view all notes.
 * 
 * @returns {ReactElement} The rendered create note page
 * 
 * @example
 * ```tsx
 * // Used in routing
 * <Route path="/" element={<CreateNotePage />} />
 * ```
 */
export const CreateNotePage = (): ReactElement => {
  const { loading, error, createCapture } = useCaptures();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Handle capture creation
   */
  const handleCreate = async (
    content: string,
    title?: string,
    tags?: string[]
  ): Promise<void> => {
    try {
      await createCapture(content, title, tags);
      
      // Check if AI generation will happen
      const aiWillGenerate = !title || !tags;
      
      // Show success message
      if (aiWillGenerate) {
        setSuccessMessage('Note created successfully! AI is generating missing metadata...');
      } else {
        setSuccessMessage('Note created successfully!');
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      // Error handling is done by CaptureForm via error prop
      console.error('Error creating note:', err);
    }
  };

  return (
    <div className="create-note-page">
      <div className="create-note-page-container">
        <div className="create-note-page-header">
          <h1 className="create-note-page-title">Create New Note</h1>
          <Link to="/slipbox" className="create-note-page-link">
            View Slipbox →
          </Link>
        </div>

        {successMessage && (
          <div className="create-note-page-success" role="alert">
            {successMessage}
          </div>
        )}

        <div className="create-note-page-form">
          <CaptureForm error={error}>
            <CaptureInput
              onSubmit={handleCreate}
              disabled={loading}
              placeholder="Write your note here. Use [[double brackets]] to link to other notes..."
            />
          </CaptureForm>
        </div>
      </div>
    </div>
  );
};
