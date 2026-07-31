import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-sentinel-bg text-center px-4">
      <div className="text-5xl mb-4">🛰️</div>
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-sentinel-muted mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary">Return to dashboard</Link>
    </div>
  );
}
