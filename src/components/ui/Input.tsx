import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  prefix?: string;
}

export const Input: React.FC<InputProps> = ({ label, hint, prefix, className = '', ...rest }) => {
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
            {prefix}
          </span>
        )}
        <input
          className={`w-full ${prefix ? 'pl-10' : 'px-3.5'} pr-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:bg-white transition ${className}`}
          {...rest}
        />
      </div>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
};
