import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  icon,
  title,
  subtitle,
  footer,
  children,
  maxWidthClassName = 'max-w-2xl'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl ${maxWidthClassName} w-full overflow-hidden border border-slate-200`}>
        <div className="p-5 bg-white text-slate-900 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {icon && <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">{icon}</div>}
            <div>
              <h3 className="text-lg font-bold text-[#0b2310]">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">{children}</div>

        {footer && <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">{footer}</div>}
      </div>
    </div>
  );
};
