import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  id,
  style,
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      <label
        htmlFor={inputId}
        style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--color-text-light)',
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
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-muted-dark)',
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
            padding: leftIcon ? '12px 14px 12px 40px' : '12px 14px',
            paddingRight: rightIcon ? '42px' : '14px',
            backgroundColor: 'rgba(8, 23, 56, 0.85)',
            border: error ? '1.5px solid var(--color-danger)' : '1px solid var(--color-border-dark)',
            borderRadius: '10px',
            color: 'var(--color-text-light)',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
            ...style,
          }}
          onFocus={(e) => {
            if (!error) e.currentTarget.style.borderColor = 'var(--color-gold-mid)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(190, 155, 73, 0.25)';
          }}
          onBlur={(e) => {
            if (!error) e.currentTarget.style.borderColor = 'var(--color-border-dark)';
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
              color: 'var(--color-text-muted-dark)',
            }}
          >
            {rightIcon}
          </span>
        )}
      </div>

      {error ? (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>{helperText}</span>
      ) : null}
    </div>
  );
};

export default Input;
