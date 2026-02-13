import { useState, ReactElement, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCaptures } from '@/features/captures/hooks/useCaptures';
import { CaptureInput } from '@/features/captures/components/CaptureInput';
import { CaptureForm } from '@/features/captures/components/CaptureForm';
import { Button } from '@/common/components/ui/Button';
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
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const submitHandlerRef = useRef<(() => Promise<void>) | null>(null);

  /**
   * Handle capture creation
   */
  const handleCreate = async (
    content: string,
    title?: string,
    tags?: string[],
    capture_type_id?: number | null,
    capture_status_id?: number | null,
    sketch_image?: string | null,
    voice_audio?: string | null,
    project_id?: number | null
  ): Promise<void> => {
    try {
      await createCapture(content, title, tags, capture_type_id, capture_status_id, sketch_image, voice_audio, undefined, undefined, project_id);
      
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
          <div className="create-note-page-header-actions">
            <Button
              onClick={() => submitHandlerRef.current?.()}
              disabled={!isFormValid || loading}
              loading={loading}
            >
              {loading ? 'Saving...' : 'Create Note'}
            </Button>
            <Link to="/slipbox" className="create-note-page-link">
              View Slipbox →
            </Link>
          </div>
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
              hideSubmitButton={true}
              onSubmitHandlerReady={(handler) => {
                submitHandlerRef.current = handler;
              }}
              onFormValidityChange={setIsFormValid}
            />
          </CaptureForm>
        </div>
      </div>
    </div>
  );
};
