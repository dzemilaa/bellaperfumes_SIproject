import React, { useState } from 'react';
import { loginClient } from '../Apolloclient';
import { gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';




const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      userId
      username
      email
    }
  }
`;

const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const ADMIN_EMAILS = ['admin@bella.com'];
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return alert("Please fill in all fields.");
    setLoading(true);
    try {
      const { data } = await loginClient.mutate({
        mutation: LOGIN,
        variables: { email, password }
      });
      const user = data.login;
      if (!ADMIN_EMAILS.includes(user.email)) {
        alert("Access denied. Not an admin account.");
        setLoading(false);
        return;
      }
      sessionStorage.setItem("admin", JSON.stringify(user));
      setIsLoggedIn(true);
      navigate('/add');
    } catch (error) {
      alert("Invalid credentials.");
    }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        <div className="flex flex-col items-center mb-8">
          <img src="/logop.png" alt="Logo" className="h-16 w-16 object-contain mb-2" />
          <h1 className="text-2xl font-bold text-pink-700">Bella Admin</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to your admin account</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bella.com"
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-pink-600 text-white py-3 rounded-xl hover:bg-pink-700 transition font-medium disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;