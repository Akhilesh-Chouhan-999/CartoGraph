import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'soft';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'normal' | 'small';
}

export function Button({
  children,
  variant = 'primary',
  size = 'normal',
  className = '',
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={`button button-${variant} ${size === 'small' ? 'button-small' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
