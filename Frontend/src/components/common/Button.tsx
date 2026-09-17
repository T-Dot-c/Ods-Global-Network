import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'outline-gold' | 'forest' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'gold',
  size = 'md',
  fullWidth = false,
  children,
  style,
  disabled,
  ...props
}) => {
  const getStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontWeight: 600,
      borderRadius: '10px',
      transition: 'all var(--transition-normal)',
      width: fullWidth ? '100%' : 'auto',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      ...style,
    };

    // Sizes
    if (size === 'sm') {
      base.padding = '8px 16px';
      base.fontSize = '0.875rem';
    } else if (size === 'lg') {
      base.padding = '14px 28px';
      base.fontSize = '1.05rem';
    } else {
      base.padding = '11px 22px';
      base.fontSize = '0.95rem';
    }

    // Variants
    if (variant === 'gold') {
      base.background = 'var(--gradient-gold)';
      base.color = 'var(--color-navy-dark)';
      base.boxShadow = 'var(--shadow-gold)';
      base.border = '1px solid rgba(245, 225, 137, 0.4)';
    } else if (variant === 'outline-gold') {
      base.background = 'transparent';
      base.color = 'var(--color-gold-bright)';
      base.border = '1.5px solid var(--color-gold-mid)';
    } else if (variant === 'forest') {
      base.background = 'var(--color-forest)';
      base.color = 'var(--color-gold-highlight)';
      base.border = '1px solid var(--color-border-dark)';
    } else {
      base.background = 'transparent';
      base.color = 'inherit';
      base.border = 'none';
    }

    return base;
  };

  return (
    <button style={getStyles()} disabled={disabled} {...props}>
      {children}
    </button>
  );
};
