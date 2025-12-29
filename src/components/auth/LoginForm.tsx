import React, { useState } from 'react';
import { useAuthStore, type User } from '../../stores/authStore';

export function LoginForm({ role }: { role: 'customer' | 'employee' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // TODO: Replace with actual API call
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      // Mock login - in production, this would call your backend
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        role: role as 'customer' | 'employee',
      };

      login(mockUser);
      // Redirect would happen here in a real app
      window.location.href = role === 'customer' ? '/customer/dashboard' : '/employee/dashboard';
    } catch (err) {
      setError('Login failed. Please try again.');
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
        className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition"
      >
        Sign In
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
