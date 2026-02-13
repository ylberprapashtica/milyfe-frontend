import React, { ReactElement } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/features/auth/components/ErrorBoundary';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { PublicRoute } from '@/features/auth/components/PublicRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ReferenceDataProvider, ReferenceDataPreload } from '@/features/captures/contexts/ReferenceDataContext';
import { CreateNotePage } from '@/features/captures/pages/CreateNotePage';
import { CapturesPage } from '@/features/captures/pages/CapturesPage';
import { CaptureDetailPage } from '@/features/captures/pages/CaptureDetailPage';
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
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <ReferenceDataProvider>
            <ReferenceDataPreload />
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
          </ReferenceDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
