import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const FloatingPaths = ({ position }: { position: number }) => {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 + i * 4} ${216 - i * 3} ${152 - i * 5} ${343 + i * 2}C${616 - i * 5} ${470 + i * 3} ${684 + i * 3} ${875 - i * 4} ${684 + i * 3} ${875 - i * 4}`,
    width: 0.5 + i * 0.03,
    opacity: 0.1 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 696 316" fill="none">
        <title>Decorative paths</title>
        {paths.map((path) => (
          <m.path
            key={path.id}
            d={path.d}
            stroke="hsl(var(--primary))"
            strokeWidth={path.width}
            strokeOpacity={path.opacity}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-gradient-to-br from-background via-background to-card">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
        <div className="relative z-10 text-center max-w-md px-8">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-[hsl(var(--glow-purple))] flex items-center justify-center shadow-lg shadow-primary/25 mb-6">
              <img src="/logo.svg" alt="Anqor" className="w-9 h-9" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Anqor
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              AI-powered insurance fraud detection. Analyze claims with machine learning, get instant risk scoring, and protect against fraudulent claims.
            </p>
          </m.div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 relative">
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-[hsl(var(--glow-purple))]/5 rounded-full blur-3xl" />

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="glass-card p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-[hsl(var(--glow-purple))] flex items-center justify-center shadow-lg shadow-primary/25 lg:hidden">
                <img src="/logo.svg" alt="Anqor" className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
                <p className="text-sm text-muted-foreground mt-1">Sign in to your Anqor account</p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </m.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-premium pl-10"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-premium pl-10 pr-10"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <m.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full btn-premium py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn className="w-4 h-4" />
                {loading ? 'Signing in...' : 'Sign In'}
              </m.button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </m.div>
      </div>
    </div>
  );
};

export default LoginPage;
