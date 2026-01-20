import React, { ReactElement } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './auth/components/ErrorBoundary';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/components/ProtectedRoute';
import { PublicRoute } from './auth/components/PublicRoute';
import { LoginPage } from './auth/pages/LoginPage';
import { RegisterPage } from './auth/pages/RegisterPage';
import { CreateNotePage } from './captures/pages/CreateNotePage';
import { CapturesPage } from './captures/pages/CapturesPage';
import { CaptureDetailPage } from './captures/pages/CaptureDetailPage';
import './App.scss';

/**
 * Main application component with routing setup
 * 
 * Sets up React Router and defines the application routes.
 * This component serves as the root router and layout wrapper.
 * Wraps the app with AuthProvider for global authentication state.
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
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <div className="App">
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <CreateNotePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/slipbox"
                element={
                  <ProtectedRoute>
                    <CapturesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/captures/:id"
                element={
                  <ProtectedRoute>
                    <CaptureDetailPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
