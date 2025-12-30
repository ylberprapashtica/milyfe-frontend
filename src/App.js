import { useState } from 'react';
import './App.scss';

function App() {
  const [thought, setThought] = useState('');

  const handleSave = () => {
    if (thought.trim()) {
      // TODO: Implement save functionality
      console.log('Saving thought:', thought);
      setThought('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
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
            onChange={(e) => setThought(e.target.value)}
            onKeyPress={handleKeyPress}
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
