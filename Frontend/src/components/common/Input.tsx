import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  compact?: boolean;
  theme?: 'dark' | 'light';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  compact = false,
  theme = 'light',
  id,
  style,
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '4px' : '6px', width: '100%' }}>
      <label
        htmlFor={inputId}
        style={{
          fontSize: compact ? '0.8rem' : '0.875rem',
          fontWeight: 600,
          color: theme === 'light' ? 'var(--color-navy-dark)' : 'var(--color-text-light)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{label}</span>
      </label>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: compact ? '10px' : '12px',
              display: 'flex',
              alignItems: 'center',
              color: theme === 'light' ? 'var(--color-text-muted)' : 'var(--color-text-muted-dark)',
              pointerEvents: 'none',
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          style={{
            width: '100%',
            padding: compact
              ? leftIcon
                ? '8px 10px 8px 34px'
                : '8px 12px'
              : leftIcon
              ? '12px 14px 12px 40px'
              : '12px 14px',
            paddingRight: rightIcon ? (compact ? '36px' : '42px') : '12px',
            backgroundColor: theme === 'light' ? '#ffffff' : 'rgba(8, 23, 56, 0.85)',
            border: error
              ? '1.5px solid var(--color-danger)'
              : theme === 'light'
              ? '1.5px solid #cbd5e1'
              : '1px solid var(--color-border-dark)',
            borderRadius: compact ? '7px' : '10px',
            color: theme === 'light' ? 'var(--color-text-dark)' : 'var(--color-text-light)',
            fontSize: compact ? '0.875rem' : '0.95rem',
            outline: 'none',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
            ...style,
          }}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.borderColor = 'var(--color-gold-mid)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(190, 155, 73, 0.2)';
          }}
          onBlur={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = theme === 'light' ? '#cbd5e1' : 'var(--color-border-dark)';
            }
            e.currentTarget.style.boxShadow = 'none';
          }}
          {...props}
        />

        {rightIcon && (
          <span
            style={{
              position: 'absolute',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              color: theme === 'light' ? 'var(--color-text-muted)' : 'var(--color-text-muted-dark)',
            }}
          >
            {rightIcon}
          </span>
        )}
      </div>

      {error ? (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: '0.8rem', color: theme === 'light' ? 'var(--color-text-muted)' : 'var(--color-text-muted-dark)' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
};

export default Input;
