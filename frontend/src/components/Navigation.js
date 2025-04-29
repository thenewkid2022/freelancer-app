import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <nav className="bg-white shadow-lg">
        <div className="container mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold text-gray-800">Zeiterfassung</div>
            <div className="space-x-4">
              <Link
                to="/login"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === '/login'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === '/register'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Registrieren
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <div className="text-xl font-bold text-gray-800">Zeiterfassung</div>
            <div className="hidden md:flex space-x-4">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Timer
              </Link>
              <Link
                to="/entries"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === '/entries'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Einträge
              </Link>
              <Link
                to="/statistics"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === '/statistics'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Statistiken
              </Link>
              <Link
                to="/profile"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === '/profile'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Profil
              </Link>
            </div>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Abmelden
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 