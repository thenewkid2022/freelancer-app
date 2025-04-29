import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      console.log('Versuche Login mit:', { email });
      await login(email, password);
      setMessage('Erfolgreich angemeldet!');
      navigate('/');
    } catch (err) {
      console.error('Login-Fehler:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setMessage(
        err.response?.data?.message || 
        'Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
        Anmeldung
      </h2>
      {message && (
        <p className={`text-center mb-4 ${message.includes('erfolgreich') ? 'text-green-500' : 'text-red-500'}`}>
          {message}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Passwort</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:bg-blue-300"
          disabled={loading}
        >
          {loading ? 'Anmeldung läuft...' : 'Anmelden'}
        </button>
      </form>
      <p className="mt-4 text-center text-gray-600">
        Noch kein Konto?{' '}
        <Link to="/register" className="text-blue-500 hover:underline">
          Registrieren
        </Link>
      </p>
    </div>
  );
};

export default Login; 