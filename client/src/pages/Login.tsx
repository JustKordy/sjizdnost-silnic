import { useState } from 'react';
import { useAuthStore } from '../store/auth.ts';
import ky from 'ky';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ky.post('http://localhost:3000/api/auth/login', {
        json: { username, password }
      }).json<{ token: string, username: string, id: number, isAdmin: boolean }>();
      
      login(res.token, res.username, res.id, res.isAdmin || false);
      navigate('/');
    } catch (e) {
      alert("Login failed: Invalid credentials");
    }
  };

  return (
    <div className="flex justify-center items-center h-full bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-96 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">Welcome Back</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
            <input 
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={username} onChange={e => setUsername(e.target.value)} required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input 
              type="password"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={password} onChange={e => setPassword(e.target.value)} required 
            />
          </div>
          <button type="submit" className="w-full bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-blue-900/40 mt-4">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
