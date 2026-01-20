import { ReactElement } from 'react';
import { RegisterForm } from '../../components/RegisterForm';
import './RegisterPage.scss';

/**
 * Register page component
 * 
 * Displays the registration form with the app's signature balloon gradient background.
 * This page allows new users to create an account and access the application.
 * 
 * @returns {ReactElement} The rendered register page
 * 
 * @example
 * ```tsx
 * // Used in routing
 * <Route path="/register" element={<RegisterPage />} />
 * ```
 */
export const RegisterPage = (): ReactElement => {
  return (
    <div className="register-page">
      <div className="register-page-container">
        <h1 className="register-page-title">Create Account</h1>
        <RegisterForm />
      </div>
    </div>
  );
};
