import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Cargando...',
  size = 'md',
  fullScreen = false,
}) => {
  const sizeClass = size === 'lg' ? 'spinner-modern-lg' : size === 'sm' ? 'spinner-modern-sm' : '';

  const content = (
    <div className="spinner-container">
      <div className={`spinner-modern ${sizeClass}`} />
      {text && <span style={{ fontSize: size === 'sm' ? '0.78rem' : '0.88rem', fontWeight: 500 }}>{text}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
        {content}
      </div>
    );
  }

  return content;
};
