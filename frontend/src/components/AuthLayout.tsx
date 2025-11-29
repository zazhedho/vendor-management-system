import React from 'react';
import { Building2 } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 to-primary-50 p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-200/20 blur-3xl animate-fade-in" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-200/20 blur-3xl animate-fade-in" style={{ animationDelay: '0.2s' }} />
            </div>

            <div className="w-full max-w-md relative z-10 animate-slide-up">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-6 border border-secondary-100">
                        <Building2 className="text-primary-600 w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-secondary-900 tracking-tight">{title}</h2>
                    <p className="text-secondary-500 mt-2">{subtitle}</p>
                </div>

                {children}

                <div className="mt-8 text-center">
                    <p className="text-xs text-secondary-400">
                        &copy; {new Date().getFullYear()} Vendor Management System. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};
