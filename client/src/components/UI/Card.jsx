import React from 'react';
import './Card.css';

/**
 * Universal Card component. 
 * "The Flat-By-Default Rule. Standard cards sit flat. Structural borders separate content."
 * 
 * Variants:
 * - container: The main grid unit wrapping standard content
 * - stat: Smaller metric indicator
 */
const Card = ({ children, variant = 'container', className = '', ...props }) => {
  const classes = `ui-card ui-card--${variant} ${className}`;
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
