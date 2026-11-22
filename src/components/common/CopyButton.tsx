import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  label = 'Copiar',
  className = '',
  variant = 'secondary',
  size = 'sm'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded cursor-pointer focus:outline-none active:scale-[0.98]';

  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-1 text-xs gap-1.5'
    : 'px-3 py-1.5 text-xs gap-1.5';

  const variantClasses = copied
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs font-semibold'
    : {
        primary: 'bg-[#DA291C] hover:bg-red-700 text-white font-bold shadow-xs',
        secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs',
        ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900',
        danger: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 shadow-2xs'
      }[variant];

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      title={copied ? '¡Copiado al portapapeles!' : `Copiar: ${textToCopy}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Copiado</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
