import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Workspace } from './Workspace';
import { Button } from '@/components/ui/button';
import { Code, AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error detected by sentinel:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 bg-neutral-900 border border-red-900/50 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-600/10 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Neural Mesh Crash</h1>
            <p className="text-neutral-400 text-sm mb-6 font-mono break-all line-clamp-4">
              {this.state.error?.message || "An unexpected error occurred in the Antigravity context."}
            </p>
            <Button onClick={() => window.location.reload()} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white border-none py-6 transition-all active:scale-95">
              <RefreshCw className="w-4 h-4" />
              Reboot Environment
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuthScreen() {
  const { signIn } = useAuth();
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.5)]">
            <Code className="w-10 h-10 text-white" />
          </div>
        </div>
        <div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight">Antigravity IDE</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Unrestricted Context. Unbound Agents.
          </p>
        </div>
        <div className="pt-8">
          <Button onClick={signIn} className="w-full group relative flex justify-center py-6 px-4 border border-transparent text-sm font-medium rounded-xl text-black bg-white hover:bg-neutral-200">
            Sign in to initialize
          </Button>
        </div>
      </div>
    </div>
  );
}

function MainLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono animate-pulse">BOOTING...</div>;
  if (!user) return <AuthScreen />;
  return <Workspace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ErrorBoundary>
  );
}
