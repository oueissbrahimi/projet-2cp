import React from 'react';
import './Button.css';

/**
 * Universal Button component adhering to "The Industrial Grid".
 * 
 * Variants:
 * - primary: App-Green, use for primary screen actions (submit, save)
 * - ghost: Flat background, use for secondary actions (cancel, back)
 * - danger: Red variant for destructive actions
 */
const Button = ({
  children,
  variant = 'primary',
  disabled = false,
  className = '',
  onClick,
  ...props
}) => {
  const classes = `ui-btn ui-btn--${variant} ${className}`;

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
