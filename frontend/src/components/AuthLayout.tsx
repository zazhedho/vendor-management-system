import React from 'react';
import { Building2, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 via-primary-50/30 to-secondary-50 p-4 relative overflow-hidden">
            {/* Animated background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradient orbs */}
                <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary-200/30 to-primary-300/20 blur-3xl animate-pulse-subtle" />
                <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-info-200/25 to-primary-200/20 blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-primary-100/20 to-secondary-200/15 blur-3xl animate-pulse-subtle" style={{ animationDelay: '2s' }} />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNDgsIDE2MywgMTg0LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-slide-up">
                {/* Logo and header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-white to-primary-50 rounded-2xl shadow-xl mb-6 border border-white/50 backdrop-blur-sm relative group">
                        <Building2 className="text-primary-600 w-10 h-10 relative z-10" />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-600/10 to-primary-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-primary-500 animate-bounce-subtle" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-900 via-primary-900 to-secondary-900 bg-clip-text text-transparent mb-2">
                        {title}
                    </h1>
                    <p className="text-secondary-600 font-medium">{subtitle}</p>
                </div>

                {/* Content */}
                <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
                    {children}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <p className="text-xs text-secondary-500 font-medium flex items-center justify-center gap-2">
                        <span className="inline-block w-1 h-1 rounded-full bg-primary-500"></span>
                        &copy; {new Date().getFullYear()} Vendor Management System
                        <span className="inline-block w-1 h-1 rounded-full bg-primary-500"></span>
                    </p>
                </div>
            </div>
        </div>
    );
};
