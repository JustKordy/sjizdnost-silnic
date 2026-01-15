import { useState } from 'react';
import ky from 'ky';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ky.post('http://localhost:3000/api/auth/register', {
        json: { username, password }
      });
      alert("Registration successful! Please login.");
      navigate('/login');
    } catch (e) {
      alert("Registration failed. Username might be taken.");
    }
  };

  return (
    <div className="flex justify-center items-center h-full bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-96 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">Create Account</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
            <input 
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
              value={username} onChange={e => setUsername(e.target.value)} required minLength={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input 
              type="password"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            />
          </div>
          <button type="submit" className="w-full bg-linear-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-green-900/40 mt-4">
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
