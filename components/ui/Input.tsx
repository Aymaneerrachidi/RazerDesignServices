"use client";

import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef, type TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, suffix, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-text-secondary font-display tracking-widest uppercase">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "input-base w-full rounded-lg h-11 text-sm font-body px-4 transition-all duration-200",
              icon && "pl-10",
              suffix && "pr-10",
              error && "border-red-500/50 focus:border-red-500/60",
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400 font-body">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-text-secondary font-display tracking-widest uppercase">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "input-base w-full rounded-lg text-sm font-body px-4 py-3 transition-all duration-200 resize-none",
            error && "border-red-500/50",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400 font-body">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-text-secondary font-display tracking-widest uppercase">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            "input-base w-full rounded-lg h-11 text-sm font-body px-4 cursor-pointer appearance-none",
            error && "border-red-500/50",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-void text-text-primary">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400 font-body">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Input, Textarea, Select };
