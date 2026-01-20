import { ReactElement } from 'react';
import { LoginForm } from '../../components/LoginForm';
import './LoginPage.scss';

/**
 * Login page component
 * 
 * Displays the login form with the app's signature balloon gradient background.
 * This page allows users to authenticate and access the application.
 * 
 * @returns {ReactElement} The rendered login page
 * 
 * @example
 * ```tsx
 * // Used in routing
 * <Route path="/login" element={<LoginPage />} />
 * ```
 */
export const LoginPage = (): ReactElement => {
  return (
    <div className="login-page">
      <div className="login-page-container">
        <h1 className="login-page-title">Welcome Back</h1>
        <LoginForm />
      </div>
    </div>
  );
};
