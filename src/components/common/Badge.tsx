import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'red' | 'emerald' | 'amber' | 'blue' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className = ''
}) => {
  const variantStyles = {
    red: 'bg-red-500/15 text-red-400 border border-red-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    slate: 'bg-slate-800 text-slate-300 border border-slate-700'
  }[variant];

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-full tracking-wide ${variantStyles} ${sizeStyles} ${className}`}>
      {children}
    </span>
  );
};
