import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, helperText, leftIcon, rightIcon, type, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPasswordField = type === 'password';
        const inputType = isPasswordField && showPassword ? 'text' : type;

        const togglePasswordVisibility = () => {
            setShowPassword(!showPassword);
        };

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-semibold text-secondary-800 mb-2">
                        {label}
                        {props.required && <span className="text-danger-500 ml-1">*</span>}
                    </label>
                )}
                <div className="relative group">
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary-400 group-focus-within:text-primary-600 transition-colors">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        type={inputType}
                        className={`
              w-full rounded-xl border bg-white text-secondary-900 placeholder:text-secondary-400
              focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
              disabled:bg-secondary-50 disabled:text-secondary-500 disabled:cursor-not-allowed
              transition-all duration-200 shadow-sm hover:shadow
              ${leftIcon ? 'pl-10' : 'px-4'}
              ${isPasswordField || rightIcon ? 'pr-10' : 'pr-4'}
              ${error
                                ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/30 bg-danger-50/30'
                                : 'border-secondary-200 hover:border-secondary-300'
                            }
              py-3
              ${className}
            `}
                        {...props}
                    />
                    {isPasswordField && (
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-secondary-400 hover:text-secondary-600 transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    )}
                    {!isPasswordField && rightIcon && (
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-secondary-400">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-2 text-sm text-danger-600 flex items-center gap-1.5 animate-slide-up">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p className="mt-2 text-sm text-secondary-500 flex items-center gap-1.5">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
