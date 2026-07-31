import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@sentinelafrica.io');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-sentinel-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🛡️</div>
          <h1 className="text-2xl font-semibold">Sentinel Africa</h1>
          <p className="text-sentinel-muted text-sm mt-1">AI-assisted cybersecurity monitoring for networks &amp; banking infrastructure</p>
        </div>

        <form onSubmit={handleSubmit} className="panel p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Email</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organization.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Password</label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-sentinel-critical">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-xs text-sentinel-muted text-center">
            Demo: admin@sentinelafrica.io / analyst@sentinelafrica.io / viewer@sentinelafrica.io — password{' '}
            <code className="text-sentinel-accent">Sentinel@2026</code>
          </p>
        </form>

        <p className="text-center text-sm text-sentinel-muted mt-4">
          No account? <Link to="/register" className="text-sentinel-accent hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
