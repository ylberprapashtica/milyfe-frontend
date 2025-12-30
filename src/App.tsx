import { ReactElement } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CapturesPage } from './captures/pages/CapturesPage';
import { CaptureDetailPage } from './captures/pages/CaptureDetailPage';
import './App.scss';

/**
 * Main application component with routing setup
 * 
 * Sets up React Router and defines the application routes.
 * This component serves as the root router and layout wrapper.
 * 
 * @returns {ReactElement} The rendered app with routing
 * 
 * @example
 * ```tsx
 * // In index.tsx
 * root.render(
 *   <React.StrictMode>
 *     <App />
 *   </React.StrictMode>
 * );
 * ```
 */
function App(): ReactElement {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<CapturesPage />} />
          <Route path="/captures/:id" element={<CaptureDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
