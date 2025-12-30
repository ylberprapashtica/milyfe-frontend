import { useState, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { capturesApi, Capture } from './services/api';
import './App.scss';

function App() {
  const [thought, setThought] = useState<string>('');
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingThought, setEditingThought] = useState<string>('');

  // Load captures on component mount
  useEffect(() => {
    loadCaptures();
  }, []);

  const loadCaptures = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await capturesApi.getCaptures();
      setCaptures(data);
    } catch (err) {
      setError('Failed to load captures. Please try again.');
      console.error('Error loading captures:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!thought.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await capturesApi.createCapture(thought.trim());
      setThought('');
      await loadCaptures();
    } catch (err) {
      setError('Failed to save capture. Please try again.');
      console.error('Error creating capture:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number): Promise<void> => {
    if (!editingThought.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await capturesApi.updateCapture(id, editingThought.trim());
      setEditingId(null);
      setEditingThought('');
      await loadCaptures();
    } catch (err) {
      setError('Failed to update capture. Please try again.');
      console.error('Error updating capture:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this capture?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await capturesApi.deleteCapture(id);
      await loadCaptures();
    } catch (err) {
      setError('Failed to delete capture. Please try again.');
      console.error('Error deleting capture:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (capture: Capture): void => {
    setEditingId(capture.id);
    setEditingThought(capture.thought);
  };

  const cancelEdit = (): void => {
    setEditingId(null);
    setEditingThought('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>, id: number): void => {
    if (e.key === 'Enter') {
      handleUpdate(id);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setThought(e.target.value);
  };

  const handleEditChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEditingThought(e.target.value);
  };

  return (
    <div className="App">
      <div className="App-container">
        <h1 className="App-title">Write your Thought</h1>
        
        {error && (
          <div className="App-error" role="alert">
            {error}
          </div>
        )}

        <div className="App-input-container">
          <input
            type="text"
            className="App-input"
            placeholder="Enter your thought..."
            value={thought}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="App-button"
            onClick={handleSave}
            disabled={!thought.trim() || loading}
          >
            {loading ? 'Saving...' : 'Capture'}
          </button>
        </div>

        <div className="App-captures">
          <h2 className="App-captures-title">Your Captures</h2>
          {loading && captures.length === 0 ? (
            <div className="App-loading">Loading captures...</div>
          ) : captures.length === 0 ? (
            <div className="App-empty">No captures yet. Start capturing your thoughts!</div>
          ) : (
            <ul className="App-captures-list">
              {captures.map((capture) => (
                <li key={capture.id} className="App-capture-item">
                  {editingId === capture.id ? (
                    <div className="App-capture-edit">
                      <input
                        type="text"
                        className="App-input App-input-edit"
                        value={editingThought}
                        onChange={handleEditChange}
                        onKeyDown={(e) => handleEditKeyDown(e, capture.id)}
                        disabled={loading}
                        autoFocus
                      />
                      <div className="App-capture-actions">
                        <button
                          className="App-button App-button-small App-button-save"
                          onClick={() => handleUpdate(capture.id)}
                          disabled={!editingThought.trim() || loading}
                        >
                          Save
                        </button>
                        <button
                          className="App-button App-button-small App-button-cancel"
                          onClick={cancelEdit}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="App-capture-content">
                        <p className="App-capture-thought">{capture.thought}</p>
                        <span className="App-capture-date">
                          {new Date(capture.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="App-capture-actions">
                        <button
                          className="App-button App-button-small App-button-edit"
                          onClick={() => startEdit(capture)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          className="App-button App-button-small App-button-delete"
                          onClick={() => handleDelete(capture.id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

