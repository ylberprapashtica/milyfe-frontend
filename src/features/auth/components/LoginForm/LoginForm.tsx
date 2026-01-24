import { ReactElement, FormEvent, useState, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '../../hooks/useLogin';
import './LoginForm.scss';

/**
 * Login form component
 * 
 * Handles user login with email and password. Displays error messages
 * and loading states. Redirects to home page on successful login.
 * 
 * @returns {ReactElement} The rendered login form
 * 
 * @example
 * ```tsx
 * <LoginForm />
 * ```
 */
export const LoginForm = (): ReactElement => {
  const { login, loading, error } = useLogin();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || loading) {
      return;
    }

    try {
      await login(email.trim(), password);
      // Navigation will be handled by the route protection
    } catch (err) {
      // Error is handled by the useLogin hook
    }
  };

  /**
   * Handle email input change
   */
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
  };

  /**
   * Handle password input change
   */
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {error && (
        <div className="login-form-error" role="alert">
          {error}
        </div>
      )}

      <div className="login-form-field">
        <label htmlFor="email" className="login-form-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="login-form-input"
          placeholder="Enter your email"
          value={email}
          onChange={handleEmailChange}
          disabled={loading}
          required
        />
      </div>

      <div className="login-form-field">
        <label htmlFor="password" className="login-form-label">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="login-form-input"
          placeholder="Enter your password"
          value={password}
          onChange={handlePasswordChange}
          disabled={loading}
          required
        />
      </div>

      <button
        type="submit"
        className="login-form-button"
        disabled={!email.trim() || !password.trim() || loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <div className="login-form-footer">
        <span className="login-form-footer-text">Don't have an account?</span>
        <Link to="/register" className="login-form-link">
          Sign up
        </Link>
      </div>
    </form>
  );
};
