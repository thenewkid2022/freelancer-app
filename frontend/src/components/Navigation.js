import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!isAuthenticated) {
    return (
      <nav className="bg-white shadow-lg">
        <div className="container mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold text-gray-800">Zeiterfassung</div>
            <div className="space-x-4">
              <Link
                to="/pricing"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === '/pricing'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Preise
              </Link>
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
            {/* Desktop Navigation */}
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
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          <div className="hidden md:block">
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2 mt-4">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setIsMenuOpen(false)}
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
                onClick={() => setIsMenuOpen(false)}
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
                onClick={() => setIsMenuOpen(false)}
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
                onClick={() => setIsMenuOpen(false)}
              >
                Profil
              </Link>
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-left"
              >
                Abmelden
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 