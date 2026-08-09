import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, Shield, Zap } from 'lucide-react';

export const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-main">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-main relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[100px]" />
      </div>

      <div className="flex w-full z-10">
        {/* Form Side */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-[400px]">
            {/* Form Container with Glassmorphism */}
            <div className="relative rounded-3xl bg-surface/80 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border/50 overflow-hidden">
              <Outlet />
            </div>
          </div>
        </div>
        
        {/* Image/Brand Side */}
        <div className="hidden lg:relative lg:flex lg:flex-1 lg:flex-col justify-center items-center p-12 overflow-hidden">
          {/* Stunning abstract/hero graphic or text */}
          <div className="relative z-10 max-w-lg text-center space-y-6">
             <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-tr from-brand to-accent shadow-xl mb-4">
                <Sparkles className="h-10 w-10 text-white" />
             </div>
             <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
                Rihala Workshop
             </h1>
             <p className="text-lg text-secondary">
                Experience the next generation of workshop management. Seamlessly track orders, payments, and your workforce in one unified platform.
             </p>
             <div className="pt-8 flex justify-center gap-6">
                <div className="flex flex-col items-center">
                   <div className="h-12 w-12 rounded-full bg-surface/50 backdrop-blur flex items-center justify-center border border-border">
                      <Shield className="h-6 w-6 text-brand" />
                   </div>
                   <span className="mt-2 text-sm font-medium text-secondary">Secure</span>
                </div>
                <div className="flex flex-col items-center">
                   <div className="h-12 w-12 rounded-full bg-surface/50 backdrop-blur flex items-center justify-center border border-border">
                      <Zap className="h-6 w-6 text-accent" />
                   </div>
                   <span className="mt-2 text-sm font-medium text-secondary">Fast</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
