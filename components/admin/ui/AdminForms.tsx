import React from 'react';

const baseInputStyles = "w-full rounded-2xl bg-surface-container-highest px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary-container/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed";

export function AdminInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const { label, className = '', ...rest } = props;
  
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-label font-bold uppercase tracking-widest text-outline mb-2">{label}</label>}
      <input className={`${baseInputStyles} ${className}`} {...rest} />
    </div>
  );
}

export function AdminTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const { label, className = '', ...rest } = props;
  
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-label font-bold uppercase tracking-widest text-outline mb-2">{label}</label>}
      <textarea className={`${baseInputStyles} resize-none ${className}`} {...rest} />
    </div>
  );
}

export function AdminSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const { label, className = '', children, ...rest } = props;
  
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-label font-bold uppercase tracking-widest text-outline mb-2">{label}</label>}
      <select className={`${baseInputStyles} appearance-none ${className}`} {...rest}>
        {children}
      </select>
    </div>
  );
}

export function AdminCheckbox({ checked, onChange, label }: { checked: boolean, onChange: (checked: boolean) => void, label: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between rounded-2xl bg-surface-container-highest px-4 py-4 text-sm cursor-pointer">
      <span className="font-body text-sm">{label}</span>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
        className="w-5 h-5 rounded border-outline-variant/30 text-primary-container focus:ring-primary-container focus:ring-offset-0 disabled:opacity-50" 
      />
    </label>
  );
}
