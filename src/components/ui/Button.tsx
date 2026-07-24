import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#a3e635] hover:bg-[#8cc627] text-[#0b2310] font-extrabold shadow-xs hover:shadow-md',
  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold',
  ghost:
    'bg-slate-800 hover:bg-slate-900 text-white font-bold',
  icon:
    'p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  ...rest
}) => {
  const sizing = variant === 'icon' ? '' : 'w-full py-2.5 px-4 text-sm';

  return (
    <button
      className={`${sizing} rounded-xl transition cursor-pointer ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};
