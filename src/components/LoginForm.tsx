import { useState } from 'react';

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Invalid email or password');
      } else {
        // Redirect based on admin status
        if (data.user?.isAdmin) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (error) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "mt-2 block w-full px-4 py-3 text-base rounded-xl border border-indigo-200 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white/90 transition duration-200 ease-in-out text-black";

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100">
      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-indigo-100">
          <h1 className="text-3xl font-bold text-indigo-900 mb-8">Login</h1>

          {error && (
            <div className="mb-6 p-4 text-red-700 bg-red-100/80 backdrop-blur-sm rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClassName}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={inputClassName}
                required
              />
            </div>

            <div className="flex flex-col space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md font-medium disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : 'Login'}
              </button>

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="text-indigo-600 hover:text-indigo-800">
                  Register here
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
