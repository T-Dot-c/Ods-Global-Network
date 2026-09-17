import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'glass' | 'forest' | 'bordered';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  padding = 'md',
  className = '',
  style,
  onClick,
}) => {
  const getPadding = () => {
    switch (padding) {
      case 'sm': return '16px';
      case 'lg': return '36px';
      default: return '24px';
    }
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'forest':
        return {
          backgroundColor: 'var(--color-navy-dark)',
          border: '1px solid var(--color-border-dark)',
        };
      case 'bordered':
        return {
          backgroundColor: 'transparent',
          border: '1.5px solid var(--color-gold-deep)',
        };
      default:
        return {
          backgroundColor: 'rgba(12, 33, 76, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(27, 59, 117, 0.85)',
        };
    }
  };

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        borderRadius: '16px',
        padding: getPadding(),
        boxShadow: 'var(--shadow-card-dark)',
        transition: 'transform var(--transition-normal), border-color var(--transition-normal)',
        ...getVariantStyles(),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Card;
