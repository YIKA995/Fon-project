import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name, email, password, organization || undefined);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-sentinel-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🛡️</div>
          <h1 className="text-2xl font-semibold">Create your Sentinel Africa account</h1>
          <p className="text-sentinel-muted text-sm mt-1">
            The first account created on a fresh deployment becomes the platform Admin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="panel p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Full name</label>
            <input required className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-xs font-medium text-sentinel-muted mb-1.5">Organization</label>
            <input className="input" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Optional" />
          </div>
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
              minLength={8}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          {error && <p className="text-sm text-sentinel-critical">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-sentinel-muted mt-4">
          Already have an account? <Link to="/login" className="text-sentinel-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
