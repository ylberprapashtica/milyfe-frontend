import { ReactElement, FormEvent, useState, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '../../hooks/useRegister';
import './RegisterForm.scss';

/**
 * Register form component
 * 
 * Handles user registration with name, email, password, and password confirmation.
 * Displays error messages and loading states. Redirects to home page on successful registration.
 * 
 * @returns {ReactElement} The rendered register form
 * 
 * @example
 * ```tsx
 * <RegisterForm />
 * ```
 */
export const RegisterForm = (): ReactElement => {
  const { register, loading, error } = useRegister();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setValidationError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    if (loading) {
      return;
    }

    try {
      await register(name.trim(), email.trim(), password);
      // Navigation will be handled by the route protection
    } catch (err) {
      // Error is handled by the useRegister hook
    }
  };

  /**
   * Handle name input change
   */
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setName(e.target.value);
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

  /**
   * Handle confirm password input change
   */
  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setConfirmPassword(e.target.value);
  };

  const displayError = validationError || error;

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      {displayError && (
        <div className="register-form-error" role="alert">
          {displayError}
        </div>
      )}

      <div className="register-form-field">
        <label htmlFor="name" className="register-form-label">
          Name
        </label>
        <input
          id="name"
          type="text"
          className="register-form-input"
          placeholder="Enter your name"
          value={name}
          onChange={handleNameChange}
          disabled={loading}
          required
        />
      </div>

      <div className="register-form-field">
        <label htmlFor="email" className="register-form-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="register-form-input"
          placeholder="Enter your email"
          value={email}
          onChange={handleEmailChange}
          disabled={loading}
          required
        />
      </div>

      <div className="register-form-field">
        <label htmlFor="password" className="register-form-label">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="register-form-input"
          placeholder="Enter your password (min. 8 characters)"
          value={password}
          onChange={handlePasswordChange}
          disabled={loading}
          required
          minLength={8}
        />
      </div>

      <div className="register-form-field">
        <label htmlFor="confirmPassword" className="register-form-label">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          className="register-form-input"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          disabled={loading}
          required
          minLength={8}
        />
      </div>

      <button
        type="submit"
        className="register-form-button"
        disabled={
          !name.trim() ||
          !email.trim() ||
          !password.trim() ||
          !confirmPassword.trim() ||
          loading
        }
      >
        {loading ? 'Creating account...' : 'Sign up'}
      </button>

      <div className="register-form-footer">
        <span className="register-form-footer-text">Already have an account?</span>
        <Link to="/login" className="register-form-link">
          Login
        </Link>
      </div>
    </form>
  );
};
