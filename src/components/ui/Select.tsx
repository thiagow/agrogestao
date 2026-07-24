import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select: React.FC<SelectProps> = ({ label, className = '', children, ...rest }) => {
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      )}
      <select
        className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:bg-white transition ${className}`}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
};
