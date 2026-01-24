import { ReactElement, ButtonHTMLAttributes } from 'react';
import './Button.scss';

/**
 * Button component variants
 */
export type ButtonVariant = 'primary' | 'secondary';

/**
 * Button component sizes
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Props for the Button component
 */
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Button variant style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Additional CSS class name */
  className?: string;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Button content */
  children: React.ReactNode;
}

/**
 * Reusable Button component
 * 
 * A styled button component that follows the app's design system with
 * glassmorphism effects, variants, and sizes.
 * 
 * @param {ButtonProps} props - Component props
 * @returns {ReactElement} The rendered button component
 * 
 * @example
 * ```tsx
 * <Button onClick={handleClick} disabled={loading} variant="primary" size="medium">
 *   {loading ? 'Saving...' : 'Create Note'}
 * </Button>
 * ```
 */
export const Button = ({
  variant = 'primary',
  size = 'medium',
  className = '',
  loading = false,
  disabled = false,
  children,
  ...props
}: ButtonProps): ReactElement => {
  const buttonClasses = [
    'ui-button',
    `ui-button--${variant}`,
    `ui-button--${size}`,
    loading && 'ui-button--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {children}
    </button>
  );
};
