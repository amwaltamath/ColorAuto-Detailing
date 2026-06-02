import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { loginUser, saveAuthToken } from '../../utils/auth';

export function LoginForm({ role }: { role: 'customer' | 'employee' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser(email, password, role);
      saveAuthToken(response.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('userRole', response.user.role);
      }
      login(response.user);
      window.location.href = role === 'customer' ? '/customer/dashboard' : '/employee/dashboard';
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <h2 className="text-2xl font-bold text-gray-900">
        {role === 'customer' ? 'Sign in' : 'Employee Login'}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isLoading ? 'Signing in…' : 'Sign In'}
      </button>

      <p className="text-center text-gray-500 text-sm">
        {role === 'customer' ? (
          <>
            Don&apos;t have an account?{' '}
            <a href="/customer/register" className="text-blue-600 font-medium hover:underline">
              Register
            </a>
          </>
        ) : (
          'Contact your administrator for access'
        )}
      </p>
    </form>
  );
}
