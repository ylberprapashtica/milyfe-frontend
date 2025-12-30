import { useState, KeyboardEvent, ChangeEvent } from 'react';
import './App.scss';

function App() {
  const [thought, setThought] = useState<string>('');

  const handleSave = (): void => {
    if (thought.trim()) {
      // TODO: Implement save functionality
      console.log('Saving thought:', thought);
      setThought('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setThought(e.target.value);
  };

  return (
    <div className="App">
      <div className="App-container">
        <h1 className="App-title">Save Your Thought</h1>
        <div className="App-input-container">
          <input
            type="text"
            className="App-input"
            placeholder="Enter your thought..."
            value={thought}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          <button
            className="App-button"
            onClick={handleSave}
            disabled={!thought.trim()}
          >
            Save the thought
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

