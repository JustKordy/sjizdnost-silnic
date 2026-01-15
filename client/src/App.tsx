import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.ts';
import MapPage from './pages/MapPage.tsx';
import LoginPage from './pages/Login.tsx';
import RegisterPage from './pages/Register.tsx';
import AdminPage from './pages/Admin.tsx';
import MyMarkersPage from './pages/MyMarkers.tsx';
import { Map, LogIn, UserPlus, LogOut, Shield, FileText } from 'lucide-react';

function NavBar() {
  const { username, isAdmin, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="px-6 py-3 bg-gray-800/90 backdrop-blur-md border-b border-gray-700 flex justify-between items-center z-50 absolute w-full top-0">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition-colors">
          <Map className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
          Sjízdnost Silnic
        </h1>
      </Link>
      
      <div className="flex items-center gap-6 text-sm font-medium">
        <Link to="/" className="hover:text-blue-400 transition-colors">Mapa</Link>
        {username ? (
          <>
            <Link to="/my-markers" className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
              <FileText className="w-4 h-4" /> Moje hlášení
            </Link>
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 transition-colors">
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}
            <div className="flex items-center gap-4 bg-gray-700/50 px-4 py-1.5 rounded-full border border-gray-600">
              <span className="text-gray-300">{username}</span>
              {isAdmin && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">ADMIN</span>
              )}
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link 
              to="/login" 
              className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
            >
              <LogIn className="w-4 h-4" /> Přihlásit
            </Link>
            <Link 
              to="/register" 
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full transition-colors shadow-lg shadow-blue-900/20"
            >
              <UserPlus className="w-4 h-4" /> Registrace
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
        <NavBar />
        
        <main className="flex-1 w-full h-full pt-16 relative">
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/my-markers" element={<MyMarkersPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
