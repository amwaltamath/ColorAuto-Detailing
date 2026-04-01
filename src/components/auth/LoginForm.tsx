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
      className="bg-white p-8 rounded-lg shadow-lg w-96"
    >
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        {role === 'customer' ? 'Customer' : 'Employee'} Login
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          placeholder="you@example.com"
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 font-bold mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>

      <p className="text-center text-gray-600 mt-4 text-sm">
        {role === 'customer' ? (
          <>
            Don't have an account?{' '}
            <a href="/customer/register" className="text-blue-600 hover:underline">
              Register here
            </a>
          </>
        ) : (
          'Contact your administrator for access'
        )}
      </p>
    </form>
  );
}
