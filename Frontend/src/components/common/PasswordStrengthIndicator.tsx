import React from 'react';

/**
 * Password Strength Calculation Helper
 * 
 * Rules:
 *  1. Length >= 8
 *  2. At least one uppercase letter [A-Z]
 *  3. At least one digit [0-9]
 *  4. At least one special symbol [^A-Za-z0-9]
 * Score ranges from 0 to 4.
 */
export const getPasswordStrength = (pwd: string): number => {
  let score = 0;
  if (!pwd) return 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

interface PasswordStrengthIndicatorProps {
  password: string;
}

/**
 * Shared Password Strength Indicator
 * Uses CSS tokens for danger, warning, and success.
 * Uses #3b82f6 (blue) as an accepted design system deviation for the "Good" tier,
 * preserving exact visual parity with RegisterPage.tsx.
 */
export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const colors = [
    'var(--color-danger, #ef4444)',
    'var(--color-warning, #f59e0b)',
    '#3b82f6', // Accepted deviation: Good tier accent
    'var(--color-success, #10b981)',
  ];
  const labels = ['Weak', 'Moderate', 'Good', 'Strong'];

  const activeColor = strength > 0 ? colors[strength - 1] : colors[0];
  const activeLabel = strength > 0 ? labels[strength - 1] : labels[0];

  return (
    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '4px', height: '4px' }}>
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              borderRadius: '2px',
              backgroundColor: idx < strength ? activeColor : 'var(--color-border-light, #e2e8f0)',
              transition: 'background-color 0.2s ease',
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontSize: '0.74rem',
          color: activeColor,
          fontWeight: 600,
        }}
        aria-live="polite"
      >
        Password strength: {activeLabel}
      </span>
    </div>
  );
};
