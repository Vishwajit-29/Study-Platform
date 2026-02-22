import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { Terminal, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.register(form);
      login(res.data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'fullName', label: 'full name', type: 'text', placeholder: 'John Doe' },
    { name: 'username', label: 'username', type: 'text', placeholder: 'johndoe' },
    { name: 'email', label: 'email', type: 'email', placeholder: 'john@example.com' },
    { name: 'password', label: 'password', type: 'password', placeholder: '********' },
  ];

  return (
    <div className="h-screen flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md">
        <div className="border border-border-primary rounded-t bg-bg-secondary">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border-primary">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-red opacity-70" />
              <span className="w-2.5 h-2.5 rounded-full bg-accent-orange opacity-70" />
              <span className="w-2.5 h-2.5 rounded-full bg-accent-green opacity-70" />
            </div>
            <span className="text-xs text-text-muted ml-2">studyplatform -- register</span>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Terminal size={18} className="text-accent-green" />
                <span className="text-lg font-semibold text-text-bright">
                  study<span className="text-accent-green">platform</span>
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                create a new account to start your learning journey.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 mb-5 bg-accent-dim-red border border-accent-red/30 rounded text-xs text-accent-red">
                <AlertTriangle size={12} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="flex items-center gap-1 text-xs text-text-secondary mb-2">
                    <ChevronRight size={10} className="text-accent-green" />
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name as keyof typeof form]}
                    onChange={handleChange}
                    className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-green transition-colors font-[inherit]"
                    placeholder={field.placeholder}
                    required
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-bg-tertiary border border-border-secondary rounded px-3 py-2.5 text-sm text-accent-green hover:bg-bg-hover hover:border-accent-green/50 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-5!"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="spinner" />
                    <span>creating account...</span>
                  </>
                ) : (
                  <>
                    <ChevronRight size={14} />
                    <span>register</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-border-primary">
              <p className="text-xs text-text-muted text-center">
                already have an account?{' '}
                <Link to="/login" className="text-accent-blue hover:underline">
                  login
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2 bg-bg-active border-x border-b border-border-primary rounded-b text-[12px] text-text-muted">
          <span>secure connection</span>
          <span>jwt + bcrypt</span>
        </div>
      </div>
    </div>
  );
}
